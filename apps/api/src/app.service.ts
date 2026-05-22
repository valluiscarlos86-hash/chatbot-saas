import { Injectable, Inject } from '@nestjs/common'
import { DATABASE_CONNECTION } from './database/database.module'
import { sql } from 'drizzle-orm'

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  getHello(): string {
    return 'AtentIA API v1.0 - OK'
  }

  async getDbStatus(): Promise<string> {
    const result = await this.db.execute(sql`SELECT current_database()`)
    return `Conectado a: ${result[0].current_database}`
  }
}