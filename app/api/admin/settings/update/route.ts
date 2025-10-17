import { NextRequest, NextResponse } from 'next/server'
import { verifyApiAuth } from '@/lib/dal'
import { db } from '@/lib/db'
import { users } from '@/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { hash, compare } from '@/lib/encryption'

/**
 * PATCH /api/admin/settings/update
 * Update username and/or password
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await verifyApiAuth()
    const body = await request.json()

    const { currentPassword, newUsername, newPassword } = body

    // Validate inputs
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }

    if (!newUsername && !newPassword) {
      return NextResponse.json(
        { error: 'Please provide new username or new password' },
        { status: 400 }
      )
    }

    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Get current user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.passwordHash)

    if (!isValid) {
      logger.warn({ userId }, 'Failed account update attempt - invalid current password')
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Check if new username is available
    if (newUsername && newUsername !== user.username) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, newUsername))
        .limit(1)

      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }

      updateData.username = newUsername
    }

    // Hash new password if provided
    if (newPassword) {
      updateData.passwordHash = await hash(newPassword)
    }

    // Update user
    await db.update(users).set(updateData).where(eq(users.id, userId))

    const changes = []
    if (newUsername) changes.push('username')
    if (newPassword) changes.push('password')

    logger.info({ userId, changes }, 'User account updated successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update account')
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
