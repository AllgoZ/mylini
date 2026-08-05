import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Built into node:crypto — no new dependency, same module the existing admin-token
// HMAC/timing-safe-compare machinery already uses (adminMiddleware.ts, admin login route).
const KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const candidateBuf = scryptSync(password, salt, KEY_LENGTH)
  if (hashBuf.length !== candidateBuf.length) return false
  return timingSafeEqual(hashBuf, candidateBuf)
}

// A plain `===` short-circuits on the first differing byte, leaking (via response
// timing) how many leading characters of a guess were correct.
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
