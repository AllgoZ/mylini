import { randomInt, createHash } from 'node:crypto'
import { OtpRepository } from '@/lib/repositories/otpRepository'
import { smsProvider } from '@/lib/integrations/sms'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import { ValidationError, AppError } from '@/lib/utils/errors'
import { captureMessage } from '@/lib/utils/sentry'

const CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 5

function hashCode(code: string, phone: string): string {
  // Salting with the phone number is enough here — OTP codes are short-lived and
  // attempt-limited (the real protections), not long-lived secrets that need a slow
  // hash like bcrypt/scrypt; SHA-256 is the right tool for a 6-digit, 5-minute code.
  return createHash('sha256').update(`${phone}:${code}`).digest('hex')
}

export const OtpService = {
  async send(phone: string): Promise<void> {
    // 60s resend cooldown + 5/hour cap — two separate windows on the same action.
    const cooldown = await checkRateLimit(`otp-send-cooldown:${phone}`, 1, 60)
    if (!cooldown.allowed) {
      throw new AppError(`Please wait ${cooldown.retryAfter}s before requesting another code.`, 429, 'RATE_LIMITED')
    }
    const hourly = await checkRateLimit(`otp-send-hourly:${phone}`, 5, 60 * 60)
    if (!hourly.allowed) {
      throw new AppError('Too many code requests. Please try again later.', 429, 'RATE_LIMITED')
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
    const codeHash = hashCode(code, phone)
    const expiresAt = new Date(Date.now() + CODE_TTL_MS)

    await OtpRepository.create(phone, codeHash, expiresAt, MAX_ATTEMPTS)
    await smsProvider.send(phone, `Your MYLINI verification code is ${code}. It expires in 5 minutes.`)
  },

  async verify(phone: string, code: string): Promise<void> {
    const otp = await OtpRepository.findLatestActiveByPhone(phone)

    // Same generic message for "no code", "expired", and "wrong code" — don't give an
    // attacker a signal about which specific condition failed.
    const invalid = () => {
      captureMessage(`OTP verify failed for ${phone}`, 'warning')
      throw new ValidationError('Invalid or expired code. Please request a new one.')
    }

    if (!otp) invalid()
    if (new Date(otp!.expires_at) < new Date()) invalid()
    if (otp!.attempts >= otp!.max_attempts) invalid()

    const codeHash = hashCode(code, phone)
    if (codeHash !== otp!.code_hash) {
      await OtpRepository.incrementAttempts(otp!.id)
      invalid()
    }

    await OtpRepository.markConsumed(otp!.id)
  },
}
