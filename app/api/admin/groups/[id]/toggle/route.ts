import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groups } from '@/schema'
import { idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'

/**
 * PATCH /api/admin/groups/[id]/toggle
 * Toggle group enabled status
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })

    // Get current group
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Toggle isEnabled
    const [updatedGroup] = await db
      .update(groups)
      .set({
        isEnabled: !group.isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning()

    if (!updatedGroup) {
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
    }

    logger.info({ userId, groupId, isEnabled: updatedGroup.isEnabled }, 'Group status toggled')

    return NextResponse.json({ group: updatedGroup })
  } catch (error) {
    logger.error({ err: error }, 'Failed to toggle group status')
    return NextResponse.json({ error: 'Failed to toggle group status' }, { status: 500 })
  }
}
