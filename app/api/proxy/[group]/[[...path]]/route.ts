import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit'
import { selectProvider, forwardRequest } from '@/lib/proxy'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'
import { groups, requestLogs } from '@/schema'
import { eq } from 'drizzle-orm'

/**
 * Main proxy endpoint: /api/proxy/{groupSlug}/**
 * Forwards requests to selected provider based on weighted round-robin algorithm
 *
 * Supports all HTTP methods: GET, POST, PUT, DELETE, PATCH, etc.
 *
 * Headers:
 * - Authorization: Bearer <api-key> OR
 * - X-API-Key: <api-key>
 *
 * Response headers:
 * - X-RateLimit-Limit: Maximum requests per minute
 * - X-RateLimit-Remaining: Remaining requests in current window
 * - X-RateLimit-Reset: Timestamp when limit resets
 * - X-Proxy-Provider: Name of the provider that handled the request
 * - X-Proxy-Response-Time: Response time in milliseconds
 */

async function handleProxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ group: string; path?: string[] }> }
) {
  const startTime = Date.now()

  try {
    const { group: groupSlug, path } = await params

    // Construct proxy path from the catch-all path parameter
    const proxyPath = path && path.length > 0 ? '/' + path.join('/') : '/'
    const url = new URL(request.url)

    logger.info(
      {
        groupSlug,
        method: request.method,
        path: proxyPath,
        query: url.search,
      },
      'Proxy request received'
    )

    // Step 1: Authenticate API key
    const apiKey = await authenticateRequest(request)

    if (!apiKey) {
      logger.warn({ groupSlug, path: proxyPath }, 'Unauthorized: Invalid or missing API key')

      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
      )
    }

    logger.debug({ apiKeyId: apiKey.id, apiKeyName: apiKey.name }, 'API key authenticated')

    // Step 2: Check if API key has access to this group
    // Global keys (groupId = null) can access all groups
    // Group-specific keys can only access their assigned group
    if (apiKey.groupId !== null) {
      // Look up the group to get its ID
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.slug, groupSlug))
        .limit(1)

      if (!group) {
        logger.warn({ groupSlug }, 'Group not found')
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }

      if (apiKey.groupId !== group.id) {
        logger.warn(
          { apiKeyId: apiKey.id, apiKeyGroupId: apiKey.groupId, requestedGroupId: group.id, groupSlug },
          'Forbidden: API key does not have access to this group'
        )

        return NextResponse.json(
          { error: 'Forbidden: API key does not have access to this group' },
          { status: 403 }
        )
      }
    }

    // Step 3: Check rate limit
    const rateLimitResult = await checkRateLimit(apiKey.id, apiKey.rateLimit)

    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

    if (!rateLimitResult.allowed) {
      logger.warn(
        { apiKeyId: apiKey.id, limit: apiKey.rateLimit },
        'Rate limit exceeded'
      )

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      )
    }

    logger.debug({ remaining: rateLimitResult.remaining }, 'Rate limit check passed')

    // Step 4: Select provider using weighted algorithm
    const { provider, weight } = await selectProvider(groupSlug)

    logger.info(
      {
        providerId: provider.id,
        providerName: provider.name,
        weight,
      },
      'Provider selected'
    )

    // Step 5: Prepare request headers and body
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Get request body if present
    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = await request.text()
      } catch (error) {
        logger.debug('No request body or failed to read body')
      }
    }

    // Step 6: Forward request to provider
    const { response, responseTime } = await forwardRequest(provider, {
      method: request.method,
      path: proxyPath + url.search,
      headers,
      body,
    })

    // Step 7: Prepare response with proxy metadata headers
    const responseHeaders = new Headers(response.headers)

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value)
    })

    // Add proxy metadata headers
    responseHeaders.set('X-Proxy-Provider', provider.name)
    responseHeaders.set('X-Proxy-Provider-ID', provider.id.toString())
    responseHeaders.set('X-Proxy-Response-Time', responseTime.toString())
    responseHeaders.set('X-Proxy-Total-Time', (Date.now() - startTime).toString())

    // Clone response body
    const responseBody = await response.arrayBuffer()

    logger.info(
      {
        groupSlug,
        providerId: provider.id,
        providerName: provider.name,
        method: request.method,
        path: proxyPath,
        status: response.status,
        responseTime,
        totalTime: Date.now() - startTime,
      },
      'Proxy request completed'
    )

    // Log request to database (non-blocking)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    // Get group ID for logging
    const [group] = await db.select().from(groups).where(eq(groups.slug, groupSlug)).limit(1)

    db.insert(requestLogs)
      .values({
        groupId: group?.id,
        providerId: provider.id,
        apiKeyId: apiKey.id,
        method: request.method,
        path: proxyPath + url.search,
        statusCode: response.status,
        responseTime,
        success: response.ok,
        errorMessage: response.ok ? null : `HTTP ${response.status}`,
        clientIp,
        userAgent,
      })
      .catch((error) => {
        logger.error({ err: error }, 'Failed to log request to database')
      })

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    const totalTime = Date.now() - startTime

    logger.error(
      {
        err: error,
        method: request.method,
        url: request.url,
        totalTime,
      },
      'Proxy request failed'
    )

    const errorMessage = error instanceof Error ? error.message : 'Internal server error'

    // Try to log failed request (non-blocking)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    db.insert(requestLogs)
      .values({
        method: request.method,
        path: request.url,
        statusCode: 500,
        responseTime: totalTime,
        success: false,
        errorMessage,
        clientIp,
        userAgent,
      })
      .catch((dbError) => {
        logger.error({ err: dbError }, 'Failed to log failed request to database')
      })

    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Export handlers for all HTTP methods
export const GET = handleProxyRequest
export const POST = handleProxyRequest
export const PUT = handleProxyRequest
export const DELETE = handleProxyRequest
export const PATCH = handleProxyRequest
export const HEAD = handleProxyRequest
export const OPTIONS = handleProxyRequest
