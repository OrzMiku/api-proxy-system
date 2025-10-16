import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groupProviders } from '@/schema'
import { idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { eq, and } from 'drizzle-orm'

/**
 * DELETE /api/admin/groups/[id]/providers/[providerId]
 * Remove a provider from a group
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; providerId: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id, providerId } = await params
    const { id: groupId } = idParamSchema.parse({ id })
    const { id: providerIdNum } = idParamSchema.parse({ id: providerId })

    // Check if group-provider relationship exists
    const [existing] = await db
      .select()
      .from(groupProviders)
      .where(and(eq(groupProviders.groupId, groupId), eq(groupProviders.providerId, providerIdNum)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found in group' }, { status: 404 })
    }

    // Remove provider from group
    await db
      .delete(groupProviders)
      .where(and(eq(groupProviders.groupId, groupId), eq(groupProviders.providerId, providerIdNum)))

    logger.info({ userId, groupId, providerId: providerIdNum }, 'Provider removed from group')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to remove provider from group')
    return NextResponse.json({ error: 'Failed to remove provider from group' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/groups/[id]/providers/[providerId]
 * Update group-provider relationship (priority, isEnabled)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; providerId: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id, providerId } = await params
    const { id: groupId } = idParamSchema.parse({ id })
    const { id: providerIdNum } = idParamSchema.parse({ id: providerId })
    const body = await request.json()

    // Check if group-provider relationship exists
    const [existing] = await db
      .select()
      .from(groupProviders)
      .where(and(eq(groupProviders.groupId, groupId), eq(groupProviders.providerId, providerIdNum)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found in group' }, { status: 404 })
    }

    // Update group-provider relationship
    const updateData: { priority?: number; isEnabled?: boolean; updatedAt: Date } = {
      updatedAt: new Date(),
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority
    }

    if (body.isEnabled !== undefined) {
      updateData.isEnabled = body.isEnabled
    }

    const [updated] = await db
      .update(groupProviders)
      .set(updateData)
      .where(and(eq(groupProviders.groupId, groupId), eq(groupProviders.providerId, providerIdNum)))
      .returning()

    logger.info(
      { userId, groupId, providerId: providerIdNum },
      'Group-provider relationship updated'
    )

    return NextResponse.json({ groupProvider: updated })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update group-provider relationship')
    return NextResponse.json(
      { error: 'Failed to update group-provider relationship' },
      { status: 500 }
    )
  }
}
