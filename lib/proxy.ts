import { db } from './db'
import { providers, groups, groupProviders } from '@/schema'
import { eq, and } from 'drizzle-orm'
import { redis } from './redis'
import { RedisKeys, RedisTTL } from './redis-keys'
import { logger } from './logger'
import { decrypt } from './encryption'

/**
 * Provider with group-specific configuration
 */
export type GroupProvider = {
  id: number
  name: string
  baseUrl: string
  apiKey: string | null
  priority: number // From group-provider relationship
  isEnabled: boolean // Combined: provider.isEnabled AND groupProvider.isEnabled
  timeout: number
  metadata: string | null
}

/**
 * Health status for a provider
 */
export type HealthStatus = {
  healthy: boolean
  consecutiveFailures: number
  lastCheck: number
  successRate: number
  avgResponseTime: number
}

/**
 * Result of provider selection
 */
export type SelectedProvider = {
  provider: GroupProvider
  weight: number
}

/**
 * Get all enabled providers for a group with Redis caching
 * Returns both the group info and its providers
 */
export async function getGroupProviders(groupSlug: string): Promise<{
  group: { id: number; slug: string; pollingStrategy: string }
  providers: GroupProvider[]
}> {
  try {
    // Find group by slug
    const [group] = await db.select().from(groups).where(eq(groups.slug, groupSlug)).limit(1)

    if (!group) {
      throw new Error(`Group not found: ${groupSlug}`)
    }

    if (!group.isEnabled) {
      throw new Error(`Group is disabled: ${groupSlug}`)
    }

    // Check Redis cache
    const cacheKey = RedisKeys.groupEndpoints(group.id)
    const cached = await redis.get(cacheKey)

    if (cached) {
      logger.debug({ groupId: group.id, groupSlug }, 'Group providers found in cache')
      return {
        group: { id: group.id, slug: group.slug, pollingStrategy: group.pollingStrategy },
        providers: JSON.parse(cached) as GroupProvider[],
      }
    }

    // Not in cache, query database
    logger.debug({ groupId: group.id, groupSlug }, 'Querying group providers from database')

    const results = await db
      .select({
        id: providers.id,
        name: providers.name,
        baseUrl: providers.baseUrl,
        apiKey: providers.apiKey,
        priority: groupProviders.priority,
        providerEnabled: providers.isEnabled,
        groupProviderEnabled: groupProviders.isEnabled,
        timeout: providers.timeout,
        metadata: providers.metadata,
      })
      .from(groupProviders)
      .innerJoin(providers, eq(groupProviders.providerId, providers.id))
      .where(
        and(
          eq(groupProviders.groupId, group.id),
          eq(providers.isEnabled, true),
          eq(groupProviders.isEnabled, true)
        )
      )

    // Decrypt API keys and map to GroupProvider type
    const groupProvidersData: GroupProvider[] = results.map((row) => ({
      id: row.id,
      name: row.name,
      baseUrl: row.baseUrl,
      apiKey: row.apiKey ? decrypt(row.apiKey) : null,
      priority: row.priority,
      isEnabled: row.providerEnabled && row.groupProviderEnabled,
      timeout: row.timeout,
      metadata: row.metadata,
    }))

    if (groupProvidersData.length === 0) {
      throw new Error(`No enabled providers found for group: ${groupSlug}`)
    }

    // Cache in Redis
    await redis.setex(cacheKey, RedisTTL.GROUP_ENDPOINTS, JSON.stringify(groupProvidersData))

    logger.info(
      { groupId: group.id, groupSlug, count: groupProvidersData.length },
      'Group providers loaded'
    )

    return {
      group: { id: group.id, slug: group.slug, pollingStrategy: group.pollingStrategy },
      providers: groupProvidersData,
    }
  } catch (error) {
    logger.error({ err: error, groupSlug }, 'Failed to get group providers')
    throw error
  }
}

/**
 * Get health status for a provider from Redis
 */
export async function getProviderHealth(providerId: number): Promise<HealthStatus> {
  try {
    const healthKey = RedisKeys.health(providerId)
    const successRateKey = RedisKeys.successRate(providerId)
    const avgResponseTimeKey = RedisKeys.avgResponseTime(providerId)

    const [healthData, successRate, avgResponseTime] = await Promise.all([
      redis.get(healthKey),
      redis.get(successRateKey),
      redis.get(avgResponseTimeKey),
    ])

    if (healthData) {
      const health = JSON.parse(healthData) as {
        healthy: boolean
        consecutiveFailures: number
        lastCheck: number
      }

      return {
        ...health,
        successRate: successRate ? parseFloat(successRate) : 100,
        avgResponseTime: avgResponseTime ? parseFloat(avgResponseTime) : 0,
      }
    }

    // No health data, assume healthy
    return {
      healthy: true,
      consecutiveFailures: 0,
      lastCheck: Date.now(),
      successRate: 100,
      avgResponseTime: 0,
    }
  } catch (error) {
    logger.error({ err: error, providerId }, 'Failed to get provider health')

    // Default to healthy if Redis fails
    return {
      healthy: true,
      consecutiveFailures: 0,
      lastCheck: Date.now(),
      successRate: 100,
      avgResponseTime: 0,
    }
  }
}

/**
 * Update provider health status after a request
 */
export async function updateProviderHealth(
  providerId: number,
  success: boolean,
  responseTime: number,
  error?: string
): Promise<void> {
  try {
    const healthKey = RedisKeys.health(providerId)
    const successRateKey = RedisKeys.successRate(providerId)
    const avgResponseTimeKey = RedisKeys.avgResponseTime(providerId)

    // Get current health
    const currentHealth = await getProviderHealth(providerId)

    // Update consecutive failures
    const consecutiveFailures = success ? 0 : currentHealth.consecutiveFailures + 1

    // Determine health status (unhealthy after 5 consecutive failures)
    const healthy = consecutiveFailures < 5

    // Update health data
    const newHealth = {
      healthy,
      consecutiveFailures,
      lastCheck: Date.now(),
    }

    // Calculate new success rate (exponential moving average)
    const alpha = 0.1 // Weight for new data
    const newSuccessRate = success
      ? currentHealth.successRate * (1 - alpha) + 100 * alpha
      : currentHealth.successRate * (1 - alpha)

    // Calculate new average response time (exponential moving average)
    const newAvgResponseTime = currentHealth.avgResponseTime * (1 - alpha) + responseTime * alpha

    // Store in Redis with TTL
    await Promise.all([
      redis.setex(healthKey, RedisTTL.HEALTH, JSON.stringify(newHealth)),
      redis.setex(successRateKey, RedisTTL.SUCCESS_RATE, newSuccessRate.toFixed(2)),
      redis.setex(avgResponseTimeKey, RedisTTL.AVG_RESPONSE_TIME, newAvgResponseTime.toFixed(0)),
    ])

    logger.debug(
      {
        providerId,
        success,
        responseTime,
        healthy,
        consecutiveFailures,
        successRate: newSuccessRate.toFixed(2),
        avgResponseTime: newAvgResponseTime.toFixed(0),
      },
      'Provider health updated'
    )

    if (!healthy && error) {
      logger.warn({ providerId, consecutiveFailures, error }, 'Provider marked as unhealthy')
    }
  } catch (err) {
    logger.error({ err, providerId }, 'Failed to update provider health')
  }
}

/**
 * Calculate weighted score for a provider based on health metrics
 *
 * Formula:
 * - Base priority (configured per provider): 0-1000
 * - Health bonus: +20 (healthy), +10 (degraded), 0 (unhealthy)
 * - Success rate bonus: 0-20 (based on percentage)
 * - Response time penalty: higher response time = higher penalty
 */
export async function calculateProviderWeight(provider: GroupProvider): Promise<number> {
  const health = await getProviderHealth(provider.id)

  // Start with base priority
  let weight = provider.priority

  // Health bonus
  if (health.healthy) {
    weight += 20
  } else if (health.consecutiveFailures < 3) {
    weight += 10 // Degraded but not completely unhealthy
  }

  // Success rate bonus (0-20 points)
  const successRateBonus = (health.successRate / 100) * 20
  weight += successRateBonus

  // Response time penalty (normalized to 0-20 range)
  // Assume 0ms = 0 penalty, 5000ms = 20 penalty
  const responseTimePenalty = Math.min((health.avgResponseTime / 5000) * 20, 20)
  weight -= responseTimePenalty

  // Ensure weight is non-negative
  weight = Math.max(weight, 0)

  logger.debug(
    {
      providerId: provider.id,
      basePriority: provider.priority,
      health: health.healthy,
      successRate: health.successRate,
      avgResponseTime: health.avgResponseTime,
      finalWeight: weight.toFixed(2),
    },
    'Provider weight calculated'
  )

  return weight
}

/**
 * Select a provider using priority-failover strategy
 * Providers are sorted by priority (descending), and the highest priority healthy provider is selected.
 * If the highest priority provider is unhealthy, fall back to the next one.
 */
export async function selectProviderWithPriorityFailover(
  groupSlug: string,
  providers: GroupProvider[]
): Promise<SelectedProvider> {
  try {
    if (providers.length === 0) {
      throw new Error(`No providers available for group: ${groupSlug}`)
    }

    // Sort providers by priority (descending)
    const sortedProviders = [...providers].sort((a, b) => b.priority - a.priority)

    // Try each provider in order of priority
    for (const provider of sortedProviders) {
      const health = await getProviderHealth(provider.id)

      // Check if provider is healthy (less than 5 consecutive failures)
      if (health.consecutiveFailures < 5) {
        logger.info(
          {
            groupSlug,
            providerId: provider.id,
            providerName: provider.name,
            priority: provider.priority,
            consecutiveFailures: health.consecutiveFailures,
          },
          'Provider selected (priority-failover)'
        )

        return {
          provider,
          weight: provider.priority,
        }
      }

      logger.debug(
        {
          groupSlug,
          providerId: provider.id,
          providerName: provider.name,
          consecutiveFailures: health.consecutiveFailures,
        },
        'Provider skipped (unhealthy)'
      )
    }

    // If all providers are unhealthy, use the highest priority one anyway
    logger.warn({ groupSlug }, 'All providers unhealthy, using highest priority provider')

    const highestPriority = sortedProviders[0]

    if (!highestPriority) {
      throw new Error(`No providers available for group: ${groupSlug}`)
    }

    return {
      provider: highestPriority,
      weight: highestPriority.priority,
    }
  } catch (error) {
    logger.error({ err: error, groupSlug }, 'Failed to select provider (priority-failover)')
    throw error
  }
}

/**
 * Select a provider using weighted round-robin algorithm
 * Filters out unhealthy providers (5+ consecutive failures)
 */
export async function selectProviderWithWeightedRoundRobin(
  groupSlug: string,
  providers: GroupProvider[]
): Promise<SelectedProvider> {
  try {
    if (providers.length === 0) {
      throw new Error(`No providers available for group: ${groupSlug}`)
    }

    // Calculate weights and filter out completely unhealthy providers
    const weightedProviders = await Promise.all(
      providers.map(async (provider) => {
        const health = await getProviderHealth(provider.id)
        const weight = await calculateProviderWeight(provider)

        return {
          provider,
          weight,
          health,
        }
      })
    )

    // Filter out unhealthy providers (5+ consecutive failures)
    const healthyProviders = weightedProviders.filter((p) => p.health.consecutiveFailures < 5)

    if (healthyProviders.length === 0) {
      logger.warn({ groupSlug }, 'No healthy providers available, using all providers')

      // If all providers are unhealthy, use them all anyway
      // (better to try an unhealthy provider than to fail completely)
      const totalWeight = weightedProviders.reduce((sum, p) => sum + p.weight, 0)

      if (totalWeight === 0) {
        // All weights are 0, pick randomly
        const randomIndex = Math.floor(Math.random() * weightedProviders.length)
        const selected = weightedProviders[randomIndex]

        if (!selected) {
          throw new Error(`No providers available for group: ${groupSlug}`)
        }

        return {
          provider: selected.provider,
          weight: 0,
        }
      }

      // Weighted random selection
      let random = Math.random() * totalWeight
      for (const p of weightedProviders) {
        random -= p.weight
        if (random <= 0) {
          return {
            provider: p.provider,
            weight: p.weight,
          }
        }
      }

      // Fallback to last provider
      const last = weightedProviders[weightedProviders.length - 1]

      if (!last) {
        throw new Error(`No providers available for group: ${groupSlug}`)
      }

      return {
        provider: last.provider,
        weight: last.weight,
      }
    }

    // Calculate total weight of healthy providers
    const totalWeight = healthyProviders.reduce((sum, p) => sum + p.weight, 0)

    if (totalWeight === 0) {
      // All weights are 0, pick randomly from healthy providers
      const randomIndex = Math.floor(Math.random() * healthyProviders.length)
      const selected = healthyProviders[randomIndex]

      if (!selected) {
        throw new Error(`No providers available for group: ${groupSlug}`)
      }

      return {
        provider: selected.provider,
        weight: 0,
      }
    }

    // Weighted random selection
    let random = Math.random() * totalWeight
    for (const p of healthyProviders) {
      random -= p.weight
      if (random <= 0) {
        logger.info(
          {
            groupSlug,
            providerId: p.provider.id,
            providerName: p.provider.name,
            weight: p.weight,
            totalWeight,
          },
          'Provider selected (weighted-round-robin)'
        )

        return {
          provider: p.provider,
          weight: p.weight,
        }
      }
    }

    // Fallback to last healthy provider
    const last = healthyProviders[healthyProviders.length - 1]

    if (!last) {
      throw new Error(`No providers available for group: ${groupSlug}`)
    }

    logger.info(
      {
        groupSlug,
        providerId: last.provider.id,
        providerName: last.provider.name,
        weight: last.weight,
      },
      'Provider selected (weighted-round-robin, fallback)'
    )

    return {
      provider: last.provider,
      weight: last.weight,
    }
  } catch (error) {
    logger.error({ err: error, groupSlug }, 'Failed to select provider (weighted-round-robin)')
    throw error
  }
}

/**
 * Select a provider based on group's polling strategy
 */
export async function selectProvider(groupSlug: string): Promise<SelectedProvider> {
  try {
    const { group, providers: groupProviders } = await getGroupProviders(groupSlug)

    // Select based on polling strategy
    switch (group.pollingStrategy) {
      case 'priority-failover':
        return await selectProviderWithPriorityFailover(groupSlug, groupProviders)

      case 'weighted-round-robin':
      default:
        return await selectProviderWithWeightedRoundRobin(groupSlug, groupProviders)
    }
  } catch (error) {
    logger.error({ err: error, groupSlug }, 'Failed to select provider')
    throw error
  }
}

/**
 * Forward a request to a provider and track health
 */
export async function forwardRequest(
  provider: GroupProvider,
  request: {
    method: string
    path: string
    headers: Record<string, string>
    body?: string
  }
): Promise<{
  response: Response
  responseTime: number
}> {
  const startTime = Date.now()

  try {
    // Build target URL
    // Remove trailing slash from baseUrl to avoid double slashes
    const baseUrl = provider.baseUrl.replace(/\/$/, '')
    const targetUrl = `${baseUrl}${request.path}`

    logger.debug(
      {
        providerId: provider.id,
        baseUrl: provider.baseUrl,
        requestPath: request.path,
        targetUrl,
      },
      'Building target URL'
    )

    // Prepare headers
    const headers = new Headers(request.headers)

    // Add provider's API key if available
    if (provider.apiKey) {
      headers.set('Authorization', `Bearer ${provider.apiKey}`)
    }

    // Remove headers that shouldn't be forwarded
    headers.delete('host')
    headers.delete('connection')

    // Make request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout)

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseTime = Date.now() - startTime

      // Update health based on response
      const success = response.ok
      await updateProviderHealth(provider.id, success, responseTime)

      logger.info(
        {
          providerId: provider.id,
          providerName: provider.name,
          method: request.method,
          path: request.path,
          status: response.status,
          responseTime,
        },
        'Request forwarded successfully'
      )

      return {
        response,
        responseTime,
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    // Update health on error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await updateProviderHealth(provider.id, false, responseTime, errorMessage)

    logger.error(
      {
        err: error,
        providerId: provider.id,
        providerName: provider.name,
        method: request.method,
        path: request.path,
        responseTime,
      },
      'Request forwarding failed'
    )

    throw error
  }
}
