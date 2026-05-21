import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://chatbot:chatbot123@localhost:5432/chatbot_dev',
  },
})
