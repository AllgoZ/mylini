// Provider-agnostic seam for sending SMS — swap ConsoleSmsProvider for a real provider
// (Twilio, MSG91, etc.) by implementing this interface and changing the export in
// src/lib/integrations/sms/index.ts. Nothing in OtpService needs to change.
export interface SmsProvider {
  send(phone: string, message: string): Promise<void>
}
