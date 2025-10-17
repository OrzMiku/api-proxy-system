import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Groups table - collections of providers that share access keys
 */
export const groups = sqliteTable('groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 100 }).notNull().unique(),
  slug: text('slug', { length: 100 }).notNull().unique(), // URL-friendly identifier for API endpoint
  description: text('description'),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  pollingStrategy: text('polling_strategy', { length: 50 })
    .notNull()
    .default('weighted-round-robin'), // 'weighted-round-robin', 'priority-failover', 'least-connections', 'ip-hash', 'random', 'round-robin'
  metadata: text('metadata'), // JSON string for additional config
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export type Group = typeof groups.$inferSelect
export type NewGroup = typeof groups.$inferInsert
