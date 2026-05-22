import { Module, Global } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev'

const client = postgres(DATABASE_URL)
export const db = drizzle(client)

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION'

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useValue: db,
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
