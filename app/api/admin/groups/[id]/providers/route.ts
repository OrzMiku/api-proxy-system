import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groupProviders, providers, groups } from '@/schema'
import { groupProviderSchema, idParamSchema } from '@/lib/validations'
import { verifyAdminAuth } from '@/lib/dal'
import { logger } from '@/lib/logger'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/admin/groups/[id]/providers
 * Get all providers in a group
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })

    // Check if group exists
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get all providers in this group
    const groupProvidersData = await db
      .select({
        id: groupProviders.id,
        providerId: groupProviders.providerId,
        priority: groupProviders.priority,
        isEnabled: groupProviders.isEnabled,
        createdAt: groupProviders.createdAt,
        updatedAt: groupProviders.updatedAt,
        provider: {
          id: providers.id,
          name: providers.name,
          baseUrl: providers.baseUrl,
          description: providers.description,
          isEnabled: providers.isEnabled,
          priority: providers.priority,
          timeout: providers.timeout,
        },
      })
      .from(groupProviders)
      .innerJoin(providers, eq(groupProviders.providerId, providers.id))
      .where(eq(groupProviders.groupId, groupId))

    return NextResponse.json({ providers: groupProvidersData })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch group providers')
    return NextResponse.json({ error: 'Failed to fetch group providers' }, { status: 500 })
  }
}

/**
 * POST /api/admin/groups/[id]/providers
 * Add a provider to a group
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifyAdminAuth()
    const { id } = await params
    const { id: groupId } = idParamSchema.parse({ id })
    const body = await request.json()

    // Validate input
    const validatedData = groupProviderSchema.parse({
      ...body,
      groupId,
    })

    // Check if group exists
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1)

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if provider exists
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, validatedData.providerId))
      .limit(1)

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Check if provider is already in group
    const [existing] = await db
      .select()
      .from(groupProviders)
      .where(
        and(
          eq(groupProviders.groupId, groupId),
          eq(groupProviders.providerId, validatedData.providerId)
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json({ error: 'Provider already in group' }, { status: 409 })
    }

    // Add provider to group
    const [newGroupProvider] = await db
      .insert(groupProviders)
      .values({
        groupId: validatedData.groupId,
        providerId: validatedData.providerId,
        priority: validatedData.priority ?? 100,
        isEnabled: validatedData.isEnabled ?? true,
      })
      .returning()

    logger.info(
      { userId, groupId, providerId: validatedData.providerId },
      'Provider added to group'
    )

    return NextResponse.json({ groupProvider: newGroupProvider }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Failed to add provider to group')
    return NextResponse.json({ error: 'Failed to add provider to group' }, { status: 500 })
  }
}
