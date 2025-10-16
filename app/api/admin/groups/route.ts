import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groups } from '@/schema'
import { groupSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { desc } from 'drizzle-orm'

/**
 * GET /api/admin/groups
 * Get all groups
 */
export async function GET() {
  try {
    await verifyAdminAuth()

    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        slug: groups.slug,
        description: groups.description,
        isEnabled: groups.isEnabled,
        pollingStrategy: groups.pollingStrategy,
        metadata: groups.metadata,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      })
      .from(groups)
      .orderBy(desc(groups.createdAt))

    return NextResponse.json({ groups: allGroups })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch groups')
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

/**
 * POST /api/admin/groups
 * Create a new group
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAdminAuth()
    const body = await request.json()

    // Validate input
    const validatedData = groupSchema.parse(body)

    // Create group
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        isEnabled: validatedData.isEnabled ?? true,
        pollingStrategy: validatedData.pollingStrategy ?? 'weighted-round-robin',
        metadata: validatedData.metadata,
      })
      .returning()

    if (!newGroup) {
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    logger.info({ userId, groupId: newGroup.id }, 'Group created')

    return NextResponse.json({ group: newGroup }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create group')

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'Group name or slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
