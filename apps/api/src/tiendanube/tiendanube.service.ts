import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../database/database.module';
import { sql } from 'drizzle-orm';
import axios from 'axios';

export interface TiendanubeAccount {
  id: string;
  org_id: string;
  store_id: string;
  access_token: string;
  store_url: string | null;
  connected_at: string;
}

export interface SimplifiedProduct {
  id: number;
  name: string;
  description: string;
  url: string;
  imageUrl: string | null;
  hasStock: boolean;
  priceFrom: string;
  variants: {
    id: number;
    label: string;
    price: string;
    promotionalPrice: string | null;
    finalPrice: string;
    stock: number | null;
    available: boolean;
  }[];
}

const HTML_ENTITIES: Record<string, string> = {
  '&ntilde;': 'ñ',
  '&Ntilde;': 'Ñ',
  '&aacute;': 'á',
  '&Aacute;': 'Á',
  '&eacute;': 'é',
  '&Eacute;': 'É',
  '&iacute;': 'í',
  '&Iacute;': 'Í',
  '&oacute;': 'ó',
  '&Oacute;': 'Ó',
  '&uacute;': 'ú',
  '&Uacute;': 'Ú',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
};

@Injectable()
export class TiendanubeService {
  private readonly logger = new Logger(TiendanubeService.name);
  private readonly simplifiedCache = new Map<string, { data: SimplifiedProduct[]; expiresAt: number }>();
  private readonly SIMPLIFIED_CACHE_TTL_MS = 60_000;
  private readonly connectedCache = new Map<string, { connected: boolean; expiresAt: number }>();
  private readonly CONNECTED_CACHE_TTL_MS = 60_000;

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private configService: ConfigService,
  ) {}

  // Devuelve la URL a la que hay que mandar al comerciante para que autorice
  // la app. Tiendanube no soporta `state` en esta URL, así que el orgId no
  // viaja acá — se resuelve en el callback vía la sesión de Clerk.
  getAuthUrl(orgId: string): string {
    const appId = this.configService.get<string>('TIENDANUBE_APP_ID');
    return `https://www.tiendanube.com/apps/${appId}/authorize`;
  }

  // Intercambia el code de OAuth por el access_token de la tienda.
  async exchangeCode(code: string): Promise<{ accessToken: string; storeId: string }> {
    const appId = this.configService.get<string>('TIENDANUBE_APP_ID');
    const clientSecret = this.configService.get<string>('TIENDANUBE_CLIENT_SECRET');

    const body = new URLSearchParams({
      client_id: appId ?? '',
      client_secret: clientSecret ?? '',
      grant_type: 'authorization_code',
      code,
    });

    try {
      const res = await axios.post(
        'https://www.tiendanube.com/apps/authorize/token',
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'AtentIA (valluiscarlos86@gmail.com)',
          },
        },
      );

      const { access_token, user_id } = res.data;
      if (!access_token || !user_id) {
        this.logger.error('Respuesta inesperada de Tiendanube:', res.data);
        throw new Error(`Respuesta inesperada de Tiendanube: ${JSON.stringify(res.data)}`);
      }

      return { accessToken: access_token, storeId: String(user_id) };
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error('Error intercambiando code de Tiendanube:', detail);
      throw new Error(`No se pudo completar la autorización con Tiendanube: ${JSON.stringify(detail)}`);
    }
  }

  // Upsert de la cuenta conectada — una org tiene una sola tienda (MVP).
  async saveAccount(orgId: string, storeId: string, accessToken: string): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO tiendanube_accounts (org_id, store_id, access_token, connected_at)
      VALUES (${orgId}, ${storeId}, ${accessToken}, now())
      ON CONFLICT (org_id) DO UPDATE
      SET store_id = ${storeId}, access_token = ${accessToken}, connected_at = now()
    `);
  }

  async getAccount(orgId: string): Promise<TiendanubeAccount | null> {
    const result = await this.db.execute(sql`
      SELECT * FROM tiendanube_accounts WHERE org_id = ${orgId} LIMIT 1
    `);
    const rows = result.rows || result;
    return (rows as TiendanubeAccount[])[0] ?? null;
  }

  // Cacheado (TTL 60s) para no pegarle a la DB en cada mensaje entrante de
  // WhatsApp — una org que manda varios mensajes seguidos no dispara un
  // SELECT por mensaje.
  async isConnected(orgId: string): Promise<boolean> {
    const cached = this.connectedCache.get(orgId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.connected;
    }

    const account = await this.getAccount(orgId);
    const connected = account !== null;
    this.connectedCache.set(orgId, { connected, expiresAt: Date.now() + this.CONNECTED_CACHE_TTL_MS });

    return connected;
  }

  // Test mínimo para validar que el access_token guardado sirve para
  // consultar la API de Tiendanube. Devuelve la respuesta cruda.
  async getProducts(orgId: string, params?: Record<string, string>): Promise<any[]> {
    const account = await this.getAccount(orgId);
    if (!account) {
      throw new NotFoundException('No hay tienda de Tiendanube conectada para esta organización');
    }

    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = `https://api.tiendanube.com/2025-03/${account.store_id}/products${query}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Authentication': `bearer ${account.access_token}`,
          'User-Agent': 'AtentIA (valluiscarlos86@gmail.com)',
          'Content-Type': 'application/json',
        },
      });

      return res.data;
    } catch (error: any) {
      this.logger.error(
        `Error consultando productos de Tiendanube (status ${error?.response?.status}):`,
        error?.response?.data,
      );
      throw error;
    }
  }

  private cleanText(html: string | null | undefined): string {
    if (!html) return '';

    let text = html.replace(/<[^>]*>/g, '');
    for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
      text = text.split(entity).join(char);
    }
    text = text.replace(/\s+/g, ' ').trim();

    return text.length > 300 ? text.slice(0, 300).trim() : text;
  }

  private localize(field: { es?: string; [key: string]: string | undefined } | string | null | undefined): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field.es ?? Object.values(field)[0] ?? '';
  }

  private toSimplifiedProduct(raw: any): SimplifiedProduct {
    const variants = (raw.variants ?? []).map((v: any) => {
      const price = v.price ?? '0';
      const promotionalPrice = v.promotional_price ?? null;
      const finalPrice = promotionalPrice ?? price;
      const values = v.values ?? [];
      const label = values.length > 0
        ? values.map((val: any) => this.localize(val)).filter(Boolean).join(' / ')
        : 'Único';

      return {
        id: v.id,
        label,
        price,
        promotionalPrice,
        finalPrice,
        stock: v.stock ?? null,
        available: v.stock === null || v.stock === undefined || v.stock > 0,
      };
    });

    const priceFrom = variants.length > 0
      ? variants.reduce((min: string, v: { finalPrice: string }) =>
          parseFloat(v.finalPrice) < parseFloat(min) ? v.finalPrice : min, variants[0].finalPrice)
      : '0';

    return {
      id: raw.id,
      name: this.localize(raw.name),
      description: this.cleanText(this.localize(raw.description)),
      url: raw.canonical_url ?? '',
      imageUrl: raw.images?.[0]?.src ?? null,
      hasStock: raw.has_stock ?? false,
      priceFrom,
      variants,
    };
  }

  // Trae todos los productos de la tienda ya transformados a un formato
  // compacto. Cacheado en memoria por orgId (60s) para no pegarle a la API
  // de Tiendanube en cada mensaje de WhatsApp (rate limit: 2 req/seg).
  async getSimplifiedProducts(orgId: string): Promise<SimplifiedProduct[]> {
    const cached = this.simplifiedCache.get(orgId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const raw = await this.getProducts(orgId, { per_page: '200' });
    const data = raw.map((p) => this.toSimplifiedProduct(p));

    this.simplifiedCache.set(orgId, { data, expiresAt: Date.now() + this.SIMPLIFIED_CACHE_TTL_MS });

    return data;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  // Búsqueda combinada: el ?q= de Tiendanube primero, y un filtro local
  // (tolerante a acentos/typos parciales) sobre el catálogo cacheado como
  // fallback, deduplicando por id y priorizando los resultados de la API.
  async searchProducts(orgId: string, query: string): Promise<SimplifiedProduct[]> {
    const allProducts = await this.getSimplifiedProducts(orgId);

    if (!query || !query.trim()) {
      return allProducts;
    }

    let apiResults: SimplifiedProduct[] = [];
    try {
      const raw = await this.getProducts(orgId, { q: query, per_page: '50' });
      apiResults = raw.map((p) => this.toSimplifiedProduct(p));
    } catch (error: any) {
      this.logger.error(
        `Error buscando productos en Tiendanube (status ${error?.response?.status}):`,
        error?.response?.data,
      );
    }

    const normalizedQuery = this.normalize(query);
    const localResults = allProducts.filter((p) => this.normalize(p.name).includes(normalizedQuery));

    const seen = new Set<number>(apiResults.map((p) => p.id));
    const combined = [...apiResults];
    for (const product of localResults) {
      if (!seen.has(product.id)) {
        seen.add(product.id);
        combined.push(product);
      }
    }

    return combined;
  }

  // Borra el vínculo de la org con Tiendanube (no revoca el token del lado
  // de Tiendanube) y limpia ambos caches en memoria para que el efecto sea
  // inmediato, sin esperar a que expire el TTL de 60s.
  async disconnect(orgId: string): Promise<void> {
    await this.db.execute(sql`DELETE FROM tiendanube_accounts WHERE org_id = ${orgId}`);
    this.connectedCache.delete(orgId);
    this.simplifiedCache.delete(orgId);
  }

  async getProductById(orgId: string, productId: string): Promise<SimplifiedProduct | null> {
    const account = await this.getAccount(orgId);
    if (!account) {
      throw new NotFoundException('No hay tienda de Tiendanube conectada para esta organización');
    }

    const url = `https://api.tiendanube.com/2025-03/${account.store_id}/products/${productId}`;

    try {
      const res = await axios.get(url, {
        headers: {
          'Authentication': `bearer ${account.access_token}`,
          'User-Agent': 'AtentIA (valluiscarlos86@gmail.com)',
          'Content-Type': 'application/json',
        },
      });

      return this.toSimplifiedProduct(res.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      this.logger.error(
        `Error consultando producto ${productId} de Tiendanube (status ${error?.response?.status}):`,
        error?.response?.data,
      );
      throw error;
    }
  }
}
