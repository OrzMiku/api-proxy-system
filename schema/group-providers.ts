import { integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { groups } from './groups'
import { providers } from './providers'

/**
 * Group-Providers junction table - many-to-many relationship
 * Tracks which providers belong to which groups with their priority
 */
export const groupProviders = sqliteTable(
  'group_providers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: integer('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    providerId: integer('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    priority: integer('priority').notNull().default(100), // Group-specific priority override
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Ensure each provider can only be added once per group
    uniqueGroupProvider: uniqueIndex('unique_group_provider').on(table.groupId, table.providerId),
  })
)

export type GroupProvider = typeof groupProviders.$inferSelect
export type NewGroupProvider = typeof groupProviders.$inferInsert
