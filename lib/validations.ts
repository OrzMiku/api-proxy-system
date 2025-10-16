import { z } from 'zod'

/**
 * Validation schemas using Zod
 * These schemas are used for both frontend and backend validation
 */

// ============================================
// Provider Schemas
// ============================================

export const providerSchema = z.object({
  name: z
    .string()
    .min(1, 'Provider name is required')
    .max(100, 'Name must be less than 100 characters'),
  baseUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional().default(true),
  priority: z.number().int().min(0).max(1000).optional().default(100),
  timeout: z.number().int().min(1000).max(120000).optional().default(30000), // 1-120 seconds
  metadata: z.string().optional(), // JSON string
})

export const updateProviderSchema = providerSchema.partial().required({ name: true })

// Use z.input to get the input type (with optional fields before defaults are applied)
export type ProviderInput = z.input<typeof providerSchema>
export type ProviderOutput = z.output<typeof providerSchema>
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>

// ============================================
// Group Schemas
// ============================================

export const groupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  isEnabled: z.boolean().optional().default(true),
  pollingStrategy: z
    .enum(['weighted-round-robin', 'least-connections', 'ip-hash', 'random', 'round-robin'])
    .optional()
    .default('weighted-round-robin'),
  metadata: z.string().optional(),
})

export const updateGroupSchema = groupSchema.partial().required({ name: true })

// Use z.input to get the input type (with optional fields before defaults are applied)
export type GroupInput = z.input<typeof groupSchema>
export type GroupOutput = z.output<typeof groupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>

// ============================================
// Group-Provider Schemas
// ============================================

export const groupProviderSchema = z.object({
  groupId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  priority: z.number().int().min(0).max(1000).default(100),
  isEnabled: z.boolean().default(true),
})

export type GroupProviderInput = z.infer<typeof groupProviderSchema>

// ============================================
// API Key Schemas
// ============================================

export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  userId: z.number().int().positive().optional(),
  groupId: z.number().int().positive().optional(), // null = global key
  isEnabled: z.boolean().default(true),
  rateLimit: z.number().int().min(1).max(100000).default(100), // Requests per minute
  expiresAt: z.date().optional(),
})

export const updateApiKeySchema = apiKeySchema.partial().required({ name: true })

export type ApiKeyInput = z.infer<typeof apiKeySchema>
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>

// ============================================
// User Schemas
// ============================================

export const userSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  role: z.enum(['admin', 'user']).default('user'),
})

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const updateUserSchema = userSchema
  .partial()
  .omit({ password: true })
  .extend({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long')
      .optional(),
  })

export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ============================================
// Request Log Schemas
// ============================================

export const requestLogSchema = z.object({
  groupId: z.number().int().positive().optional(),
  providerId: z.number().int().positive().optional(),
  apiKeyId: z.number().int().positive().optional(),
  method: z.string().max(10),
  path: z.string(),
  statusCode: z.number().int().optional(),
  responseTime: z.number().int().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  clientIp: z.string().max(45).optional(),
  userAgent: z.string().optional(),
  requestSize: z.number().int().optional(),
  responseSize: z.number().int().optional(),
  metadata: z.string().optional(),
})

export type RequestLogInput = z.infer<typeof requestLogSchema>

// ============================================
// Common Schemas
// ============================================

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
})

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>
