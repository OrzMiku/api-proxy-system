import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { providerSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { encrypt } from '@/lib/encryption'
import { desc } from 'drizzle-orm'

/**
 * GET /api/admin/providers
 * Get all providers
 */
export async function GET() {
  try {
    await verifyAdminAuth()

    const allProviders = await db
      .select({
        id: providers.id,
        name: providers.name,
        baseUrl: providers.baseUrl,
        description: providers.description,
        isEnabled: providers.isEnabled,
        priority: providers.priority,
        timeout: providers.timeout,
        metadata: providers.metadata,
        createdAt: providers.createdAt,
        updatedAt: providers.updatedAt,
        // Don't return API key for security
      })
      .from(providers)
      .orderBy(desc(providers.createdAt))

    return NextResponse.json({ providers: allProviders })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch providers')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}

/**
 * POST /api/admin/providers
 * Create a new provider
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdminAuth()
    const body = await request.json()

    // Validate request body
    const validation = providerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Encrypt API key if provided
    const encryptedApiKey = data.apiKey ? encrypt(data.apiKey) : null

    // Create provider
    const [newProvider] = await db
      .insert(providers)
      .values({
        name: data.name,
        baseUrl: data.baseUrl,
        apiKey: encryptedApiKey,
        description: data.description,
        isEnabled: data.isEnabled,
        priority: data.priority,
        timeout: data.timeout,
        metadata: data.metadata,
      })
      .returning()

    if (!newProvider) {
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    logger.info({ userId, providerId: newProvider.id }, 'Provider created')

    // Don't return encrypted API key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _apiKey, ...providerWithoutKey } = newProvider

    return NextResponse.json({ provider: providerWithoutKey }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create provider')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
  }
}
