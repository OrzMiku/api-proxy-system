import Redis from 'ioredis'

if (!process.env['REDIS_URL']) {
  throw new Error('REDIS_URL environment variable is not set')
}

/**
 * Redis singleton client instance
 * Uses auto-pipelining for optimal performance
 *
 * @example
 * import { redis } from '@/lib/redis'
 *
 * await redis.set('key', 'value')
 * const value = await redis.get('key')
 */
export const redis = new Redis(process.env['REDIS_URL'], {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  enableAutoPipelining: true, // Automatically batches commands for better performance
  lazyConnect: false, // Connect immediately
  connectTimeout: 10000, // 10 seconds
  commandTimeout: 5000, // 5 seconds per command
})

// Error handling
redis.on('error', (error) => {
  console.error('Redis connection error:', error)
})

redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands')
})

redis.on('close', () => {
  console.warn('⚠️  Redis connection closed')
})

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...')
})
