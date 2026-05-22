import { Injectable, Inject } from '@nestjs/common'
import { DATABASE_CONNECTION } from '../database/database.module'
import { sql } from 'drizzle-orm'

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async findAll() {
    const result = await this.db.execute(
      sql`SELECT id, name, email, plan, is_active, created_at FROM organizations`
    )
    return result
  }

  async findOne(id: string) {
    const result = await this.db.execute(
      sql`SELECT id, name, email, plan, is_active, created_at FROM organizations WHERE id = ${id}`
    )
    return result[0] ?? null
  }
}