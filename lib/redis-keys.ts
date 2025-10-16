/**
 * Redis key naming utilities
 * Provides consistent key naming conventions across the application
 *
 * Key structure:
 * - health:{providerId} - Provider health status
 * - weight:{groupId}:{providerId} - Dynamic polling weight
 * - group:{groupId}:endpoints - Cached group endpoint list
 * - ratelimit:{apiKeyId}:{window} - Rate limit counter
 * - stats:{providerId}:{date} - Daily provider statistics
 */

export const RedisKeys = {
  /**
   * Health status key for a provider
   * Stores: { healthy: boolean, consecutiveFailures: number, lastCheck: timestamp }
   * TTL: 5 minutes
   */
  health: (providerId: number) => `health:${providerId}`,

  /**
   * Dynamic polling weight for a provider in a group
   * Stores: number (calculated weight)
   * TTL: 1 minute
   */
  weight: (groupId: number, providerId: number) => `weight:${groupId}:${providerId}`,

  /**
   * Cached endpoint list for a group
   * Stores: JSON array of provider objects
   * TTL: 5 minutes
   */
  groupEndpoints: (groupId: number) => `group:${groupId}:endpoints`,

  /**
   * Rate limit counter for an API key
   * Stores: number (request count)
   * TTL: Based on rate limit window
   */
  rateLimit: (apiKeyId: number, window: number) => {
    const windowKey = Math.floor(Date.now() / window)
    return `ratelimit:${apiKeyId}:${windowKey}`
  },

  /**
   * Daily statistics for a provider
   * Stores: JSON object { requests: number, failures: number, avgResponseTime: number }
   * TTL: 7 days
   */
  providerStats: (providerId: number, date: string) => `stats:${providerId}:${date}`,

  /**
   * Success rate for a provider (rolling window)
   * Stores: number (percentage 0-100)
   * TTL: 5 minutes
   */
  successRate: (providerId: number) => `success:${providerId}`,

  /**
   * Average response time for a provider (rolling window)
   * Stores: number (milliseconds)
   * TTL: 5 minutes
   */
  avgResponseTime: (providerId: number) => `response_time:${providerId}`,

  /**
   * Current active connections for a provider (for least-connections strategy)
   * Stores: number
   * TTL: None (atomic increment/decrement)
   */
  activeConnections: (providerId: number) => `connections:${providerId}`,

  /**
   * API key cache
   * Stores: JSON object of API key details
   * TTL: 10 minutes
   */
  apiKey: (key: string) => `apikey:${key}`,
} as const

/**
 * Redis TTL constants (in seconds)
 */
export const RedisTTL = {
  HEALTH: 300, // 5 minutes
  WEIGHT: 60, // 1 minute
  GROUP_ENDPOINTS: 300, // 5 minutes
  PROVIDER_STATS: 604800, // 7 days
  SUCCESS_RATE: 300, // 5 minutes
  AVG_RESPONSE_TIME: 300, // 5 minutes
  API_KEY_CACHE: 600, // 10 minutes
} as const
