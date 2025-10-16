import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '@/schema'

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Extract file path from DATABASE_URL (format: "file:./dev.db")
const dbPath = process.env['DATABASE_URL'].replace(/^file:/, '')

/**
 * SQLite connection client
 */
const sqlite = new Database(dbPath)

/**
 * Drizzle ORM database instance
 * Use this instance for all database operations
 *
 * @example
 * import { db } from '@/lib/db'
 * import { users } from '@/schema'
 *
 * const allUsers = await db.select().from(users)
 */
export const db = drizzle(sqlite, { schema })
