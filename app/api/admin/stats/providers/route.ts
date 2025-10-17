import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/dal'
import { db } from '@/lib/db'
import { providers, requestLogs } from '@/schema'
import { getProviderHealth } from '@/lib/proxy'
import { eq, sql } from 'drizzle-orm'

/**
 * GET /api/admin/stats/providers
 * Get statistics for all providers including health status
 */
export async function GET(_request: NextRequest) {
  try {
    await verifyAdminAuth()

    // Get all providers from database
    const allProviders = await db.select().from(providers)

    // Fetch health data from Redis for each provider
    const providerStats = await Promise.all(
      allProviders.map(async (provider) => {
        const health = await getProviderHealth(provider.id)

        // Get request count for this provider from database
        const [requestStats] = await db
          .select({
            totalRequests: sql<number>`count(*)`,
            successfulRequests: sql<number>`sum(case when ${requestLogs.success} = 1 then 1 else 0 end)`,
            failedRequests: sql<number>`sum(case when ${requestLogs.success} = 0 then 1 else 0 end)`,
          })
          .from(requestLogs)
          .where(eq(requestLogs.providerId, provider.id))

        return {
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          isEnabled: provider.isEnabled,
          priority: provider.priority,
          health: {
            healthy: health.healthy,
            consecutiveFailures: health.consecutiveFailures,
            lastCheck: health.lastCheck,
            successRate: health.successRate,
            avgResponseTime: health.avgResponseTime,
          },
          stats: {
            totalRequests: requestStats?.totalRequests || 0,
            successfulRequests: requestStats?.successfulRequests || 0,
            failedRequests: requestStats?.failedRequests || 0,
          },
        }
      })
    )

    return NextResponse.json({ providers: providerStats })
  } catch (error) {
    console.error('Failed to get provider stats:', error)
    return NextResponse.json({ error: 'Failed to get provider statistics' }, { status: 500 })
  }
}
