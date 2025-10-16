import 'dotenv/config'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'

/**
 * Database migration script
 * Run with: pnpm db:migrate
 *
 * This script applies all pending migrations to the database
 */

const runMigrations = async () => {
  if (!process.env['DATABASE_URL']) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  console.log('🔄 Running migrations...')

  // Extract file path from DATABASE_URL (format: "file:./dev.db")
  const dbPath = process.env['DATABASE_URL'].replace(/^file:/, '')
  const sqlite = new Database(dbPath)
  const db = drizzle(sqlite)

  try {
    migrate(db, { migrationsFolder: './drizzle/migrations' })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    sqlite.close()
  }
}

runMigrations()
