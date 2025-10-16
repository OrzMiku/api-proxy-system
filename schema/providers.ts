import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Providers table - stores API endpoint providers
 */
export const providers = sqliteTable('providers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 100 }).notNull(),
  baseUrl: text('base_url').notNull(), // e.g., "https://api.provider.com"
  apiKey: text('api_key'), // Encrypted provider API key (optional, some providers may not need)
  description: text('description'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  priority: integer('priority').notNull().default(100), // Default priority weight
  timeout: integer('timeout').notNull().default(30000), // Request timeout in ms
  metadata: text('metadata'), // JSON string for additional config
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
