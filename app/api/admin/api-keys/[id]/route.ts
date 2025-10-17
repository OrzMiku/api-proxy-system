import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/schema'
import { idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { maskApiKey } from '@/lib/encryption'
import { eq } from 'drizzle-orm'

/**
 * GET /api/admin/api-keys/[id]
 * Get a specific API key by ID (with masked key)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminAuth()
    const { id } = await params
    const { id: apiKeyId } = idParamSchema.parse({ id })

    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1)

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Mask the key for security
    return NextResponse.json({
      apiKey: {
        ...apiKey,
        key: maskApiKey(apiKey.key),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch API key')
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/api-keys/[id]
 * Update an API key (cannot update the key itself)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: apiKeyId } = idParamSchema.parse({ id })
    const body = await request.json()

    // Check if API key exists
    const [existingKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1)

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Update API key (excluding the key itself)
    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        name: body.name,
        description: body.description,
        isEnabled: body.isEnabled,
        rateLimit: body.rateLimit,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId))
      .returning()

    if (!updatedKey) {
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    logger.info({ userId, apiKeyId }, 'API key updated')

    return NextResponse.json({
      apiKey: {
        ...updatedKey,
        key: maskApiKey(updatedKey.key),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update API key')
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete an API key
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: apiKeyId } = idParamSchema.parse({ id })

    // Check if API key exists
    const [existingKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1)

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Delete API key
    await db.delete(apiKeys).where(eq(apiKeys.id, apiKeyId))

    logger.info({ userId, apiKeyId }, 'API key deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete API key')
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
