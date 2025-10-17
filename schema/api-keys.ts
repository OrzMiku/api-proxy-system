import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { groups } from './groups'
import { users } from './users'

/**
 * API Keys table - manages access keys for the proxy service
 * Keys can be global (access all groups) or group-specific
 */
export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key', { length: 255 }).notNull().unique(), // The actual API key (hashed)
  name: text('name', { length: 100 }).notNull(), // Friendly name for identification
  description: text('description'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }), // Owner of the key
  groupId: integer('group_id').references(() => groups.id, { onDelete: 'cascade' }), // null = global key
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  rateLimit: integer('rate_limit').notNull().default(100), // Requests per minute
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // null = never expires
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
