/**
 * Seed script to create test data for the API proxy system
 * Run with: pnpm tsx scripts/seed-test-data.ts
 */

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { db } from '../lib/db'
import { providers, groups, groupProviders, apiKeys, users } from '../schema'
import { encrypt, hash, generateApiKey } from '../lib/encryption'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Starting to seed test data...\n')

  // 1. Create or get test user
  console.log('1️⃣ Creating test user...')
  const [existingUser] = await db.select().from(users).where(eq(users.username, 'admin')).limit(1)

  let userId: number

  if (existingUser) {
    console.log('   ✓ User "admin" already exists')
    userId = existingUser.id
  } else {
    const hashedPassword = await hash('admin123')
    const [newUser] = await db
      .insert(users)
      .values({
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      })
      .returning()

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    userId = newUser.id
    console.log('   ✓ Created user "admin" (password: admin123)')
  }

  // 2. Create test providers (simulating different API services)
  console.log('\n2️⃣ Creating test providers...')

  const testProviders = [
    {
      name: 'Provider A - Fast',
      baseUrl: 'https://api.provider-a.example.com',
      description: 'High-speed provider with low latency',
      priority: 150, // Higher priority
      timeout: 5000,
    },
    {
      name: 'Provider B - Reliable',
      baseUrl: 'https://api.provider-b.example.com',
      description: 'Highly reliable provider with good uptime',
      priority: 100,
      timeout: 10000,
    },
    {
      name: 'Provider C - Backup',
      baseUrl: 'https://api.provider-c.example.com',
      description: 'Backup provider for failover',
      priority: 50, // Lower priority
      timeout: 15000,
    },
  ]

  const createdProviders = []

  for (const provider of testProviders) {
    // Generate a test API key for the provider
    const providerApiKey = generateApiKey('test_', 32)
    const encryptedKey = encrypt(providerApiKey)

    const [created] = await db
      .insert(providers)
      .values({
        ...provider,
        apiKey: encryptedKey,
        isEnabled: true,
        metadata: JSON.stringify({ testKey: providerApiKey }), // Store for reference
      })
      .returning()

    if (!created) {
      throw new Error('Failed to create provider')
    }

    createdProviders.push(created)
    console.log(`   ✓ Created provider: ${created.name} (ID: ${created.id})`)
  }

  // 3. Create test groups
  console.log('\n3️⃣ Creating test groups...')

  const testGroups = [
    {
      name: 'Production API',
      slug: 'production',
      description: 'Production API endpoint group with all providers',
      pollingStrategy: 'weighted-round-robin' as const,
    },
    {
      name: 'Development API',
      slug: 'development',
      description: 'Development API endpoint group',
      pollingStrategy: 'round-robin' as const,
    },
  ]

  const createdGroups = []

  for (const group of testGroups) {
    const [created] = await db
      .insert(groups)
      .values({
        ...group,
        isEnabled: true,
      })
      .returning()

    if (!created) {
      throw new Error('Failed to create group')
    }

    createdGroups.push(created)
    console.log(`   ✓ Created group: ${created.name} (slug: ${created.slug})`)
  }

  // 4. Assign providers to groups
  console.log('\n4️⃣ Assigning providers to groups...')

  // Production group gets all providers
  const productionGroup = createdGroups[0]
  if (!productionGroup) {
    throw new Error('Production group not found')
  }

  for (const provider of createdProviders) {
    if (!provider) continue

    await db.insert(groupProviders).values({
      groupId: productionGroup.id,
      providerId: provider.id,
      priority: provider.priority,
      isEnabled: true,
    })

    console.log(`   ✓ Added ${provider.name} to ${productionGroup.name}`)
  }

  // Development group gets only first two providers
  const developmentGroup = createdGroups[1]
  if (!developmentGroup) {
    throw new Error('Development group not found')
  }

  for (let i = 0; i < 2; i++) {
    const provider = createdProviders[i]
    if (!provider) continue

    await db.insert(groupProviders).values({
      groupId: developmentGroup.id,
      providerId: provider.id,
      priority: provider.priority,
      isEnabled: true,
    })

    console.log(`   ✓ Added ${provider.name} to ${developmentGroup.name}`)
  }

  // 5. Create test API keys
  console.log('\n5️⃣ Creating test API keys...')

  const testApiKeys = [
    {
      name: 'Global Test Key',
      description: 'Test key with access to all groups',
      groupId: null, // Global key
      rateLimit: 100,
    },
    {
      name: 'Production Only Key',
      description: 'Test key with access to production group only',
      groupId: productionGroup.id,
      rateLimit: 50,
    },
  ]

  for (const keyData of testApiKeys) {
    const plainKey = generateApiKey('apx_', 40)
    const hashedKey = await hash(plainKey)

    const [created] = await db
      .insert(apiKeys)
      .values({
        ...keyData,
        userId,
        key: hashedKey,
        isEnabled: true,
        expiresAt: null,
      })
      .returning()

    if (!created) {
      throw new Error('Failed to create API key')
    }

    console.log(`   ✓ Created API key: ${created.name}`)
    console.log(`     Plain key: ${plainKey}`)
    console.log(`     ID: ${created.id}`)
  }

  console.log('\n✅ Test data seeded successfully!')
  console.log('\n📝 Summary:')
  console.log(`   - Providers: ${createdProviders.length}`)
  console.log(`   - Groups: ${createdGroups.length}`)
  console.log(`   - API Keys: ${testApiKeys.length}`)
  console.log('\n🚀 You can now test the proxy at:')
  console.log(`   - http://localhost:3004/api/proxy/production`)
  console.log(`   - http://localhost:3004/api/proxy/development`)
  console.log('\n💡 Use one of the API keys above in the Authorization header')
}

seed()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error seeding data:', error)
    process.exit(1)
  })
