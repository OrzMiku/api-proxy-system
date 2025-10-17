import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/dal'
import { db } from '@/lib/db'
import { requestLogs, providers, apiKeys } from '@/schema'
import { desc, eq } from 'drizzle-orm'

/**
 * GET /api/admin/stats/recent-requests
 * Get recent request logs with related provider and API key info
 */
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAuth()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent requests with joins
    const recentRequests = await db
      .select({
        id: requestLogs.id,
        method: requestLogs.method,
        path: requestLogs.path,
        statusCode: requestLogs.statusCode,
        responseTime: requestLogs.responseTime,
        success: requestLogs.success,
        errorMessage: requestLogs.errorMessage,
        clientIp: requestLogs.clientIp,
        createdAt: requestLogs.createdAt,
        providerId: requestLogs.providerId,
        providerName: providers.name,
        apiKeyId: requestLogs.apiKeyId,
        apiKeyName: apiKeys.name,
      })
      .from(requestLogs)
      .leftJoin(providers, eq(requestLogs.providerId, providers.id))
      .leftJoin(apiKeys, eq(requestLogs.apiKeyId, apiKeys.id))
      .orderBy(desc(requestLogs.createdAt))
      .limit(limit)

    return NextResponse.json({ requests: recentRequests })
  } catch (error) {
    console.error('Failed to get recent requests:', error)
    return NextResponse.json({ error: 'Failed to get recent requests' }, { status: 500 })
  }
}
