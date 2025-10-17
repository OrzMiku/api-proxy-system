import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiKeys } from '@/schema'
import { idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { maskApiKey } from '@/lib/encryption'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/admin/api-keys/[id]/toggle
 * Toggle API key enabled status
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: apiKeyId } = idParamSchema.parse({ id })

    // Get current API key
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.id, apiKeyId)).limit(1)

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Toggle isEnabled
    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        isEnabled: !apiKey.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(apiKeys.id, apiKeyId))
      .returning()

    if (!updatedKey) {
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    logger.info({ userId, apiKeyId, isEnabled: updatedKey.isEnabled }, 'API key status toggled')

    return NextResponse.json({
      apiKey: {
        ...updatedKey,
        key: maskApiKey(updatedKey.key),
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle API key status')
    return NextResponse.json({ error: 'Failed to toggle API key status' }, { status: 500 })
  }
}
