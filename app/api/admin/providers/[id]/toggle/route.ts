import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/schema'
import { idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/providers/[id]/toggle
 * Toggle provider enabled status
 */
export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await context.params
    const validation = idParamSchema.safeParse({ id })

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 })
    }

    const providerId = validation.data.id

    // Get current provider status
    const [provider] = await db.select().from(providers).where(eq(providers.id, providerId)).limit(1)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Toggle enabled status
    const [updatedProvider] = await db
      .update(providers)
      .set({
        isEnabled: !provider.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(providers.id, providerId))
      .returning()

    logger.info(
      { userId, providerId, isEnabled: updatedProvider?.isEnabled },
      'Provider status toggled'
    )

    return NextResponse.json({ provider: updatedProvider })
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle provider status')

    if (error instanceof Error && error.message === 'Forbidden: Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to toggle provider status' }, { status: 500 })
  }
}
