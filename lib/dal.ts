import 'server-only'
import { cache } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

/**
 * Data Access Layer (DAL)
 *
 * SECURITY: Never rely on middleware alone for authentication (CVE-2025-29927)
 * Always validate authentication using these DAL functions in:
 * - Server Components
 * - Server Actions
 * - API Routes
 *
 * This layer provides a secure wrapper around session management
 */

/**
 * Get the current session (cached)
 * Returns null if not authenticated
 *
 * @example
 * const session = await getSession()
 * if (!session) {
 *   return <LoginPrompt />
 * }
 */
export const getSession = cache(async () => {
  return await auth()
})

/**
 * Verify user is authenticated
 * Throws error if not authenticated
 *
 * @example
 * const session = await verifyAuth()
 * // Guaranteed to have session here
 */
export async function verifyAuth() {
  const session = await getSession()

  if (!session?.user) {
    logger.warn('Unauthorized access attempt')
    throw new Error('Unauthorized')
  }

  return session
}

/**
 * Require authentication (for Server Components)
 * Redirects to login if not authenticated
 *
 * @example
 * export default async function ProtectedPage() {
 *   const session = await requireAuth()
 *   return <div>Hello {session.user.name}</div>
 * }
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session?.user) {
    logger.warn('Unauthenticated user redirected to login')
    redirect('/login')
  }

  return session
}

/**
 * Require admin role
 * Redirects to unauthorized page if not admin
 *
 * @example
 * export default async function AdminPage() {
 *   await requireAdmin()
 *   return <AdminDashboard />
 * }
 */
export async function requireAdmin() {
  const session = await requireAuth()

  if (session.user.role !== 'admin') {
    logger.warn({ userId: session.user.id }, 'Non-admin user attempted to access admin resource')
    redirect('/unauthorized')
  }

  return session
}

/**
 * Check if user has admin role
 * Returns boolean without redirecting
 *
 * @example
 * const isAdmin = await checkIsAdmin()
 * if (isAdmin) {
 *   // Show admin features
 * }
 */
export async function checkIsAdmin() {
  const session = await getSession()
  return session?.user?.role === 'admin'
}

/**
 * Get current user ID
 * Returns null if not authenticated
 *
 * @example
 * const userId = await getCurrentUserId()
 * if (!userId) {
 *   return null
 * }
 */
export async function getCurrentUserId() {
  const session = await getSession()
  return session?.user?.id ? parseInt(session.user.id) : null
}

/**
 * Verify API action authentication (for Server Actions)
 * Returns user ID or throws error
 *
 * @example
 * async function deleteItem(id: number) {
 *   'use server'
 *   const userId = await verifyApiAuth()
 *   // Proceed with authenticated action
 * }
 */
export async function verifyApiAuth() {
  const session = await verifyAuth()
  return parseInt(session.user.id)
}

/**
 * Verify admin API action
 * Returns user ID or throws error if not admin
 *
 * @example
 * async function deleteUser(id: number) {
 *   'use server'
 *   await verifyAdminAuth()
 *   // Proceed with admin action
 * }
 */
export async function verifyAdminAuth() {
  const session = await verifyAuth()

  if (session.user.role !== 'admin') {
    logger.warn({ userId: session.user.id }, 'Non-admin user attempted admin API action')
    throw new Error('Forbidden: Admin access required')
  }

  return parseInt(session.user.id)
}
