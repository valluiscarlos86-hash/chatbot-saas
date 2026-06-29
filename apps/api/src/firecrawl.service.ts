import { Injectable, Logger } from '@nestjs/common';

export interface ScrapedPage {
  title: string;
  content: string;
}

export interface CrawledPage extends ScrapedPage {
  url: string;
}

// Aísla el proveedor de scraping (hoy Firecrawl) detrás de una sola función,
// para poder cambiarlo sin tocar el resto del pipeline de documentos.
@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);

  async scrapeUrl(url: string): Promise<ScrapedPage> {
    const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Firecrawl respondió ${res.status}: ${body}`);
      throw new Error(`No se pudo leer la página (status ${res.status})`);
    }

    const data = await res.json();
    const content = data?.data?.markdown ?? '';
    const title = data?.data?.metadata?.title ?? url;

    return { title, content };
  }

  // Rastrea un sitio completo (no solo la URL dada) usando el endpoint de crawl
  // de Firecrawl, que es asíncrono: hay que iniciar el job y consultarlo hasta
  // que termine. `limit` evita rastrear sitios enteros sin control.
  async crawlSite(url: string, limit = 12): Promise<CrawledPage[]> {
    const startRes = await fetch('https://api.firecrawl.dev/v2/crawl', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        limit,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    if (!startRes.ok) {
      const body = await startRes.text().catch(() => '');
      this.logger.error(`Firecrawl (crawl start) respondió ${startRes.status}: ${body}`);
      throw new Error(`No se pudo iniciar el rastreo del sitio (status ${startRes.status})`);
    }

    const startData = await startRes.json();
    const jobId = startData?.id;
    if (!jobId) {
      throw new Error('Firecrawl no devolvió un id de rastreo');
    }

    const maxAttempts = 36; // ~3 minutos a 5s por intento
    const pollIntervalMs = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const statusRes = await fetch(`https://api.firecrawl.dev/v2/crawl/${jobId}`, {
        headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      });

      if (!statusRes.ok) {
        const body = await statusRes.text().catch(() => '');
        this.logger.error(`Firecrawl (crawl status) respondió ${statusRes.status}: ${body}`);
        throw new Error(`Error consultando el estado del rastreo (status ${statusRes.status})`);
      }

      const statusData = await statusRes.json();

      if (statusData?.status === 'completed') {
        const pages = (statusData?.data ?? []) as any[];
        return pages
          .filter((p) => typeof p?.markdown === 'string' && p.markdown.trim().length > 0)
          .map((p) => ({
            title: p?.metadata?.title ?? p?.metadata?.url ?? url,
            content: p.markdown,
            url: p?.metadata?.url ?? url,
          }));
      }

      if (statusData?.status === 'failed') {
        throw new Error('El rastreo del sitio falló del lado de Firecrawl');
      }
      // 'scraping' u otro estado intermedio: seguimos esperando
    }

    throw new Error('El rastreo del sitio tardó demasiado y se canceló');
  }
}
