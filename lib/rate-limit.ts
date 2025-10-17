import { redis } from './redis'
import { RedisKeys } from './redis-keys'
import { logger } from './logger'

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  reset: number // Timestamp when the limit resets
}

/**
 * Sliding window rate limiting implementation using Redis
 *
 * @param apiKeyId - The API key ID to rate limit
 * @param limit - Maximum number of requests allowed per minute
 * @returns RateLimitResult indicating if the request is allowed
 *
 * @example
 * const result = await checkRateLimit(apiKeyId, 100)
 * if (!result.allowed) {
 *   return Response with 429 status
 * }
 */
export async function checkRateLimit(
  apiKeyId: number,
  limit: number
): Promise<RateLimitResult> {
  const windowMs = 60000 // 1 minute in milliseconds
  const now = Date.now()
  const windowKey = Math.floor(now / windowMs)

  const key = RedisKeys.rateLimit(apiKeyId, windowMs)

  try {
    // Increment the counter atomically
    const count = await redis.incr(key)

    // Set expiration if this is the first request in the window
    if (count === 1) {
      await redis.pexpire(key, windowMs)
    }

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)
    const reset = (windowKey + 1) * windowMs

    if (!allowed) {
      logger.warn(
        { apiKeyId, count, limit },
        'Rate limit exceeded'
      )
    }

    return {
      allowed,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    logger.error({ err: error, apiKeyId }, 'Rate limit check failed')

    // Fail open - allow the request if Redis fails
    // In production, you might want to fail closed instead
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: now + windowMs,
    }
  }
}

/**
 * Creates rate limit headers to include in the response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Resets the rate limit for an API key (useful for testing or admin actions)
 */
export async function resetRateLimit(apiKeyId: number): Promise<void> {
  const windowMs = 60000
  const key = RedisKeys.rateLimit(apiKeyId, windowMs)

  try {
    await redis.del(key)
    logger.info({ apiKeyId }, 'Rate limit reset')
  } catch (error) {
    logger.error({ err: error, apiKeyId }, 'Failed to reset rate limit')
    throw error
  }
}
