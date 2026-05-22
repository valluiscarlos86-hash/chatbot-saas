import { Injectable, Inject } from '@nestjs/common'
import { Webhook } from 'svix'
import { DATABASE_CONNECTION } from '../database/database.module'
import { sql } from 'drizzle-orm'

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async handleClerkEvent(headers: Record<string, string>, body: any) {
const secret = process.env.CLERK_WEBHOOK_SECRET!

    const wh = new Webhook(secret)
    const payload = JSON.stringify(body)

    const evt = wh.verify(payload, {
      'svix-id': headers['svix-id'],
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    }) as any

    if (evt.type === 'user.created') {
      await this.db.execute(sql`
        INSERT INTO organizations (clerk_user_id, name, email)
        VALUES (
          ${evt.data.id},
         ${evt.data.email_addresses[0].email_address.split('@')[0]},
          ${evt.data.email_addresses[0].email_address}
        )
      `)
    }

    return { received: true }
  }
}