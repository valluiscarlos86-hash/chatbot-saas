import { defineConfig } from 'drizzle-kit'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL,
  },
})
