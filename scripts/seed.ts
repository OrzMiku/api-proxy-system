import 'dotenv/config'
import { db } from '@/lib/db'
import { users } from '@/schema'
import { hash } from '@/lib/encryption'
import { eq } from 'drizzle-orm'

/**
 * Database seeding script
 * Creates initial admin user if it doesn't exist
 *
 * Run with: tsx scripts/seed.ts
 */

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Check if admin user exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1)

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return
    }

    // Create admin user
    const passwordHash = await hash('admin123')

    await db.insert(users).values({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      name: 'Administrator',
      role: 'admin',
    })

    console.log('✅ Admin user created successfully')
    console.log('   Username: admin')
    console.log('   Password: admin123')
    console.log('   ⚠️  Please change the password after first login!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }

  console.log('✅ Seeding completed')
  process.exit(0)
}

seed()
