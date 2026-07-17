import { z } from 'zod'

// Simple phone-only login (no OTP verification for now — reverted per request; the
// OTP infrastructure below is still built and ready, just not wired into the login route).
export const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .describe('10-digit phone number'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const otpSendSchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .describe('10-digit phone number'),
})

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export type OtpSendInput = z.infer<typeof otpSendSchema>
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>
