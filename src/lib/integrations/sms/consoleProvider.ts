import type { SmsProvider } from './types'

// Default provider — no real SMS account exists for this project yet. Logs server-side
// only (never returned in any API response) so OTP flows are testable end-to-end before
// a real provider (Twilio/MSG91/etc.) is wired in.
export const ConsoleSmsProvider: SmsProvider = {
  async send(phone: string, message: string): Promise<void> {
    console.log(`[SMS stub] to ${phone}: ${message}`)
  },
}
