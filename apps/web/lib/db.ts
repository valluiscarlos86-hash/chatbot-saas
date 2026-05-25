import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(
  process.env.DATABASE_URL ?? 'postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev'
)

export const db = drizzle(client)