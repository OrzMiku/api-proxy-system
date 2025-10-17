import { NextRequest } from 'next/server'
import { db } from './db'
import { apiKeys } from '@/schema'
import { compare } from './encryption'
import { redis } from './redis'
import { RedisKeys, RedisTTL } from './redis-keys'
import { logger } from './logger'

export type AuthenticatedApiKey = {
  id: number
  name: string
  userId: number | null
  groupId: number | null
  isEnabled: boolean
  rateLimit: number
  expiresAt: Date | null
}

/**
 * Extracts API key from request headers
 * Supports both 'Authorization: Bearer <key>' and 'X-API-Key: <key>' formats
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

/**
 * Verifies an API key and returns the key details if valid
 * Uses Redis caching to reduce database queries
 *
 * @throws Error if API key is invalid, disabled, or expired
 */
export async function verifyApiKey(apiKey: string): Promise<AuthenticatedApiKey> {
  if (!apiKey) {
    throw new Error('API key is required')
  }

  // Check Redis cache first
  const cacheKey = RedisKeys.apiKey(apiKey)
  const cached = await redis.get(cacheKey)

  if (cached) {
    logger.debug({ apiKey: apiKey.substring(0, 10) }, 'API key found in cache')
    const parsedKey = JSON.parse(cached) as AuthenticatedApiKey

    // Convert expiresAt back to Date if it exists
    if (parsedKey.expiresAt) {
      parsedKey.expiresAt = new Date(parsedKey.expiresAt)
    }

    // Check if expired
    if (parsedKey.expiresAt && parsedKey.expiresAt < new Date()) {
      throw new Error('API key has expired')
    }

    return parsedKey
  }

  // Not in cache, query database
  logger.debug({ apiKey: apiKey.substring(0, 10) }, 'API key not in cache, querying database')

  // Get all API keys from database (we need to compare hashes)
  const allKeys = await db.select().from(apiKeys)

  // Find matching key by comparing hashes
  let matchedKey: typeof apiKeys.$inferSelect | null = null

  for (const key of allKeys) {
    const isMatch = await compare(apiKey, key.key)
    if (isMatch) {
      matchedKey = key
      break
    }
  }

  if (!matchedKey) {
    throw new Error('Invalid API key')
  }

  // Check if key is enabled
  if (!matchedKey.isEnabled) {
    throw new Error('API key is disabled')
  }

  // Check if key is expired
  if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
    throw new Error('API key has expired')
  }

  // Build response object
  const authenticatedKey: AuthenticatedApiKey = {
    id: matchedKey.id,
    name: matchedKey.name,
    userId: matchedKey.userId,
    groupId: matchedKey.groupId,
    isEnabled: matchedKey.isEnabled,
    rateLimit: matchedKey.rateLimit,
    expiresAt: matchedKey.expiresAt,
  }

  // Cache the key details in Redis
  await redis.setex(cacheKey, RedisTTL.API_KEY_CACHE, JSON.stringify(authenticatedKey))

  logger.info({ apiKeyId: matchedKey.id, name: matchedKey.name }, 'API key verified successfully')

  return authenticatedKey
}

/**
 * Middleware function to authenticate API requests
 *
 * @example
 * const apiKey = await authenticateRequest(request)
 * if (!apiKey) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 * }
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedApiKey | null> {
  try {
    const apiKey = extractApiKey(request)
    if (!apiKey) {
      return null
    }

    return await verifyApiKey(apiKey)
  } catch (error) {
    logger.warn({ err: error }, 'API key authentication failed')
    return null
  }
}
