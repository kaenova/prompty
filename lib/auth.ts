import crypto from "crypto"

/**
 * Hash a password using SHA-256
 * Note: In production, use bcrypt or argon2 for better security
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

/**
 * Generate a random token for invites
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return `pk_${crypto.randomBytes(32).toString("hex")}`
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID()
}
