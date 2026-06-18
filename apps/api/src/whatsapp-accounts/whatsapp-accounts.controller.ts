import { Controller, Get, Post, Query, Body, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { sql } from 'drizzle-orm';

function maskToken(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 4) return '••••';
  return `••••${token.slice(-4)}`;
}

@Controller('whatsapp-accounts')
export class WhatsappAccountsController {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

  @Get()
  async getAccount(@Query('orgId') orgId: string) {
    if (!orgId) return { account: null };

    const result = await this.db.execute(sql`
      SELECT id, phone_number, phone_number_id, business_account_id, access_token, is_active
      FROM whatsapp_accounts
      WHERE org_id = ${orgId}
      LIMIT 1
    `);
    const rows = result.rows || result;
    const account = (rows as any[])[0];
    if (!account) return { account: null };

    return {
      account: {
        phoneNumber: account.phone_number,
        phoneNumberId: account.phone_number_id,
        businessAccountId: account.business_account_id,
        accessTokenMasked: maskToken(account.access_token),
        isActive: account.is_active,
      },
    };
  }

  @Post()
  async upsertAccount(
    @Body()
    body: {
      orgId: string;
      phoneNumber: string;
      phoneNumberId: string;
      accessToken?: string;
      businessAccountId?: string;
    },
  ) {
    const { orgId, phoneNumber, phoneNumberId, accessToken, businessAccountId } = body;
    if (!orgId || !phoneNumber || !phoneNumberId) {
      return { error: 'orgId, phoneNumber y phoneNumberId son requeridos' };
    }

    const existing = await this.db.execute(sql`
      SELECT id, access_token FROM whatsapp_accounts WHERE org_id = ${orgId} LIMIT 1
    `);
    const existingRows = existing.rows || existing;
    const existingAccount = (existingRows as any[])[0];

    if (existingAccount) {
      const tokenToSave = accessToken && accessToken.trim() !== '' ? accessToken : existingAccount.access_token;
      await this.db.execute(sql`
        UPDATE whatsapp_accounts
        SET phone_number = ${phoneNumber},
            phone_number_id = ${phoneNumberId},
            business_account_id = ${businessAccountId ?? null},
            access_token = ${tokenToSave},
            is_active = true
        WHERE id = ${existingAccount.id}
      `);
    } else {
      if (!accessToken || accessToken.trim() === '') {
        return { error: 'accessToken es requerido para crear una cuenta nueva' };
      }
      await this.db.execute(sql`
        INSERT INTO whatsapp_accounts (org_id, phone_number, phone_number_id, business_account_id, access_token, is_active)
        VALUES (${orgId}, ${phoneNumber}, ${phoneNumberId}, ${businessAccountId ?? null}, ${accessToken}, true)
      `);
    }

    return { success: true };
  }
}
