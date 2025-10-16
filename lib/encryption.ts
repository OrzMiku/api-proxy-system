import crypto from 'crypto'

/**
 * Encryption utilities for sensitive data (API keys, credentials)
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For GCM, nonce should be 12 bytes, but we use 16 for compatibility
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

if (!process.env['ENCRYPTION_KEY']) {
  throw new Error('ENCRYPTION_KEY environment variable is not set')
}

const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY']

/**
 * Derives a 32-byte encryption key from the master key and salt
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512')
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns a base64-encoded string containing: salt:iv:authTag:encryptedData
 *
 * @param plaintext - The data to encrypt
 * @returns Encrypted data in base64 format
 *
 * @example
 * const encrypted = encrypt('my-api-key')
 * // Returns: "base64string..."
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string')
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key from master key and salt
  const key = deriveKey(salt)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt data
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get authentication tag
  const authTag = cipher.getAuthTag()

  // Combine salt:iv:authTag:encrypted and encode as base64
  const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')])

  return combined.toString('base64')
}

/**
 * Decrypts a string encrypted with the encrypt function
 *
 * @param encryptedData - Base64-encoded encrypted data
 * @returns Decrypted plaintext string
 *
 * @example
 * const decrypted = decrypt(encrypted)
 * // Returns: "my-api-key"
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string')
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64')

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH)
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    )
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH).toString('hex')

    // Derive key from master key and salt
    const key = deriveKey(salt)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error('Decryption failed: Invalid encrypted data or key')
  }
}

/**
 * Hashes a string using bcrypt (for passwords)
 * Note: For API keys stored in database, use encrypt() instead
 *
 * @param plaintext - The string to hash
 * @returns Hashed string
 */
export async function hash(plaintext: string): Promise<string> {
  const bcrypt = await import('bcrypt')
  return bcrypt.hash(plaintext, 10)
}

/**
 * Compares a plaintext string with a bcrypt hash
 *
 * @param plaintext - The plaintext to compare
 * @param hash - The hash to compare against
 * @returns True if they match
 */
export async function compare(plaintext: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt')
  return bcrypt.compare(plaintext, hash)
}

/**
 * Generates a cryptographically secure random API key
 *
 * @param prefix - Optional prefix (e.g., 'sk_live_')
 * @param length - Length of the random part (default: 32)
 * @returns Generated API key
 *
 * @example
 * const apiKey = generateApiKey('sk_live_')
 * // Returns: "sk_live_abc123..."
 */
export function generateApiKey(prefix = 'sk_', length = 32): string {
  const randomBytes = crypto.randomBytes(length)
  const randomString = randomBytes.toString('base64url').slice(0, length)
  return `${prefix}${randomString}`
}

/**
 * Masks an API key for display purposes
 * Shows first 10 and last 4 characters
 *
 * @param apiKey - The API key to mask
 * @returns Masked API key
 *
 * @example
 * maskApiKey('sk_live_abc123def456ghi789')
 * // Returns: "sk_live_ab...i789"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 14) {
    return '***'
  }
  const start = apiKey.slice(0, 10)
  const end = apiKey.slice(-4)
  return `${start}...${end}`
}
