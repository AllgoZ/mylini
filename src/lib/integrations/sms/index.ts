import { ConsoleSmsProvider } from './consoleProvider'
import type { SmsProvider } from './types'

// Single place to swap in a real provider later — everything else imports from here,
// not from consoleProvider.ts directly.
export const smsProvider: SmsProvider = ConsoleSmsProvider

export type { SmsProvider } from './types'
