import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { apiKeys } from './api-keys'
import { groups } from './groups'
import { providers } from './providers'

/**
 * Request Logs table - stores proxy request history and metrics
 * Used for analytics, debugging, and performance monitoring
 */
export const requestLogs = sqliteTable('request_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').references(() => groups.id, { onDelete: 'set null' }),
  providerId: integer('provider_id').references(() => providers.id, { onDelete: 'set null' }),
  apiKeyId: integer('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  method: text('method', { length: 10 }).notNull(), // HTTP method: GET, POST, etc.
  path: text('path').notNull(), // Request path
  statusCode: integer('status_code'), // HTTP response status code
  responseTime: integer('response_time'), // Response time in milliseconds
  success: integer('success', { mode: 'boolean' }).notNull(), // SQLite compatibility
  errorMessage: text('error_message'), // Error details if failed
  clientIp: text('client_ip', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'),
  requestSize: integer('request_size'), // Request body size in bytes
  responseSize: integer('response_size'), // Response body size in bytes
  metadata: text('metadata'), // JSON string for additional info
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export type RequestLog = typeof requestLogs.$inferSelect
export type NewRequestLog = typeof requestLogs.$inferInsert
