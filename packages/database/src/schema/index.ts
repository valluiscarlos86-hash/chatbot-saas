import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['free', 'basic', 'pro', 'enterprise'])
export const convStatusEnum = pgEnum('conversation_status', ['bot_active', 'human_takeover', 'closed'])
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system'])
export const docStatusEnum = pgEnum('document_status', ['pending', 'processing', 'ready', 'error'])

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').unique(),
  clerkUserId: text('clerk_user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  plan: planEnum('plan').default('free').notNull(),
  monthlyMessageLimit: integer('monthly_message_limit').default(150).notNull(),
  monthlyMessageCount: integer('monthly_message_count').default(0).notNull(),
  credits: integer('credits').default(200).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isTrial: boolean('is_trial').default(true).notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const whatsappAccounts = pgTable('whatsapp_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  phoneNumber: text('phone_number').notNull(),
  phoneNumberId: text('phone_number_id').notNull(),
  accessToken: text('access_token').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  whatsappAccountId: uuid('whatsapp_account_id').references(() => whatsappAccounts.id).notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerName: text('customer_name'),
  status: convStatusEnum('status').default('bot_active').notNull(),
  assignedAgentId: text('assigned_agent_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used').default(0),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  status: docStatusEnum('status').default('pending').notNull(),
  chunkCount: integer('chunk_count').default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})