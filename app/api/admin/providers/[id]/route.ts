import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { updateProviderSchema, idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { encrypt, decrypt } from '@/lib/encryption'
import { eq } from 'drizzle-orm'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/providers/[id]
 * Get a single provider by ID
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await verifyAdminAuth()
    const { id } = await context.params
    const validation = idParamSchema.safeParse({ id })

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 })
    }

    const providerId = validation.data.id

    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Decrypt API key if it exists
    const decryptedApiKey = provider.apiKey ? decrypt(provider.apiKey) : null

    return NextResponse.json({
      provider: {
        ...provider,
        apiKey: decryptedApiKey,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch provider')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/providers/[id]
 * Update a provider
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await context.params
    const idValidation = idParamSchema.safeParse({ id })

    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 })
    }

    const providerId = idValidation.data.id
    const body = await request.json()

    // Validate request body
    const validation = updateProviderSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Encrypt API key if provided
    const encryptedApiKey = data.apiKey ? encrypt(data.apiKey) : undefined

    // Update provider
    const [updatedProvider] = await db
      .update(providers)
      .set({
        name: data.name,
        baseUrl: data.baseUrl,
        apiKey: encryptedApiKey,
        description: data.description,
        isEnabled: data.isEnabled,
        priority: data.priority,
        timeout: data.timeout,
        metadata: data.metadata,
        updatedAt: new Date(),
      })
      .where(eq(providers.id, providerId))
      .returning()

    if (!updatedProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    logger.info({ userId, providerId }, 'Provider updated')

    // Don't return encrypted API key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey: _apiKey, ...providerWithoutKey } = updatedProvider

    return NextResponse.json({ provider: providerWithoutKey })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update provider')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/providers/[id]
 * Delete a provider
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await context.params
    const validation = idParamSchema.safeParse({ id })

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 })
    }

    const providerId = validation.data.id

    const [deletedProvider] = await db
      .delete(providers)
      .where(eq(providers.id, providerId))
      .returning()

    if (!deletedProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    logger.info({ userId, providerId }, 'Provider deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete provider')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
  }
}
