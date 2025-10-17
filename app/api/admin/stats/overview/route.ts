import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/dal'
import { db } from '@/lib/db'
import { requestLogs } from '@/schema'
import { sql } from 'drizzle-orm'

/**
 * GET /api/admin/stats/overview
 * Get overall system statistics
 */
export async function GET(_request: NextRequest) {
  try {
    await verifyAdminAuth()

    // Get overall request statistics
    const [overallStats] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        successfulRequests: sql<number>`sum(case when ${requestLogs.success} = 1 then 1 else 0 end)`,
        failedRequests: sql<number>`sum(case when ${requestLogs.success} = 0 then 1 else 0 end)`,
        avgResponseTime: sql<number>`avg(${requestLogs.responseTime})`,
      })
      .from(requestLogs)

    // Get requests grouped by hour for the last 24 hours
    const requestsByHour = await db
      .select({
        hour: sql<string>`strftime('%Y-%m-%d %H:00', ${requestLogs.createdAt})`,
        count: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${requestLogs.success} = 1 then 1 else 0 end)`,
        failCount: sql<number>`sum(case when ${requestLogs.success} = 0 then 1 else 0 end)`,
      })
      .from(requestLogs)
      .where(sql`${requestLogs.createdAt} >= datetime('now', '-24 hours')`)
      .groupBy(sql`strftime('%Y-%m-%d %H:00', ${requestLogs.createdAt})`)
      .orderBy(sql`strftime('%Y-%m-%d %H:00', ${requestLogs.createdAt})`)

    const successRate = overallStats?.totalRequests
      ? ((overallStats.successfulRequests / overallStats.totalRequests) * 100).toFixed(2)
      : '0'

    return NextResponse.json({
      overview: {
        totalRequests: overallStats?.totalRequests || 0,
        successfulRequests: overallStats?.successfulRequests || 0,
        failedRequests: overallStats?.failedRequests || 0,
        successRate: parseFloat(successRate),
        avgResponseTime: Math.round(overallStats?.avgResponseTime || 0),
      },
      requestsByHour,
    })
  } catch (error) {
    console.error('Failed to get overview stats:', error)
    return NextResponse.json(
      { error: 'Failed to get overview statistics' },
      { status: 500 }
    )
  }
}
