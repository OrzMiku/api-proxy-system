/**
 * Central export file for all database schemas
 * Import from this file to ensure consistent schema usage across the application
 */

export * from './users'
export * from './providers'
export * from './groups'
export * from './group-providers'
export * from './api-keys'
export * from './request-logs'

// Export all schemas as a single object for Drizzle migrations
import { users } from './users'
import { providers } from './providers'
import { groups } from './groups'
import { groupProviders } from './group-providers'
import { apiKeys } from './api-keys'
import { requestLogs } from './request-logs'

export const schema = {
  users,
  providers,
  groups,
  groupProviders,
  apiKeys,
  requestLogs,
}
