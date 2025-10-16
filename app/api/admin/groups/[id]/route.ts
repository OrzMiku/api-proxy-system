import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groups } from '@/schema'
import { updateGroupSchema, idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'

/**
 * GET /api/admin/groups/[id]
 * Get a specific group by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({ group })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch group')
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/groups/[id]
 * Update a group
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })
    const body = await request.json()

    // Validate input
    const validatedData = updateGroupSchema.parse(body)

    // Check if group exists
    const [existingGroup] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Update group
    const [updatedGroup] = await db
      .update(groups)
      .set({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        isEnabled: validatedData.isEnabled,
        pollingStrategy: validatedData.pollingStrategy,
        metadata: validatedData.metadata,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning()

    logger.info({ userId, groupId }, 'Group updated')

    return NextResponse.json({ group: updatedGroup })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update group')

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Group name or slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/groups/[id]
 * Delete a group
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })

    // Check if group exists
    const [existingGroup] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Delete group (cascading delete will handle group_providers)
    await db.delete(groups).where(eq(groups.id, groupId))

    logger.info({ userId, groupId }, 'Group deleted')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete group')
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
