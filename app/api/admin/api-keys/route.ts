import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/schema'
import { apiKeySchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { generateApiKey, hash, maskApiKey } from '@/lib/encryption'
import { desc } from 'drizzle-orm'

/**
 * GET /api/admin/api-keys
 * Get all API keys (without the actual key values)
 */
export async function GET() {
  try {
    await verifyAdminAuth()

    const allApiKeys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        key: apiKeys.key, // Will be masked
        description: apiKeys.description,
        userId: apiKeys.userId,
        groupId: apiKeys.groupId,
        isEnabled: apiKeys.isEnabled,
        rateLimit: apiKeys.rateLimit,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt))

    // Mask all keys for security
    const maskedKeys = allApiKeys.map((key) => ({
      ...key,
      key: maskApiKey(key.key),
    }))

    return NextResponse.json({ apiKeys: maskedKeys })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch API keys')
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

/**
 * POST /api/admin/api-keys
 * Create a new API key
 * Returns the plain text key ONLY ONCE
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdminAuth()
    const body = await request.json()

    // Validate input
    const validatedData = apiKeySchema.parse(body)

    // Generate a new API key
    const plainKey = generateApiKey('apx_', 40) // apx = api proxy

    // Hash the key for storage
    const hashedKey = await hash(plainKey)

    // Create API key record
    const [newApiKey] = await db
      .insert(apiKeys)
      .values({
        name: validatedData.name,
        key: hashedKey,
        description: validatedData.description,
        userId: validatedData.userId || userId,
        groupId: validatedData.groupId || null,
        isEnabled: validatedData.isEnabled ?? true,
        rateLimit: validatedData.rateLimit ?? 100,
        expiresAt: validatedData.expiresAt || null,
      })
      .returning()

    if (!newApiKey) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    logger.info({ userId, apiKeyId: newApiKey.id }, 'API key created')

    // Return the plain key ONLY in the creation response
    return NextResponse.json(
      {
        apiKey: {
          ...newApiKey,
          key: plainKey, // Plain text key - shown ONLY ONCE
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error({ err: error }, 'Failed to create API key')

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'API key name already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
