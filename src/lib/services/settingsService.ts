import { SettingsRepository } from '@/lib/repositories/settingsRepository'
import { hashPassword, verifyPassword, timingSafeStringEqual } from '@/lib/utils/password'
import { AppError } from '@/lib/utils/errors'
import type { PublicStoreSettings, AdminSettingsView, StoreSettings } from '@/types/settings'
import type { UpdateStoreSettingsInput, ChangeAdminCredentialsInput } from '@/lib/validations/settingsSchema'

export const SettingsService = {
  // The only thing an unauthenticated storefront request can ever see — an explicit
  // field allowlist, never a raw table row, so a future column addition here can't
  // silently become publicly readable.
  async getPublicSettings(): Promise<PublicStoreSettings> {
    const s = await SettingsRepository.getSettings()
    return {
      shipping_charge: s.shipping_charge,
      free_shipping_threshold: s.free_shipping_threshold,
      tax_rate: s.tax_rate,
      maintenance_mode: s.maintenance_mode,
      maintenance_message: s.maintenance_message,
      store_name: s.store_name,
    }
  },

  async getForAdmin(): Promise<AdminSettingsView> {
    const [settings, credentials] = await Promise.all([
      SettingsRepository.getSettings(),
      SettingsRepository.getCredentials(),
    ])
    return {
      ...settings,
      admin_email_override: credentials.admin_email,
      has_password_override: !!credentials.admin_password_hash,
    }
  },

  async updateSettings(patch: UpdateStoreSettingsInput): Promise<StoreSettings> {
    // Empty-string form fields mean "clear this optional field" — store as null rather
    // than an empty string sitting in an otherwise-nullable column.
    const cleaned: Record<string, unknown> = { ...patch }
    for (const key of ['store_email', 'store_phone', 'store_address', 'order_notification_email', 'maintenance_message']) {
      if (cleaned[key] === '') cleaned[key] = null
    }
    return SettingsRepository.updateSettings(cleaned)
  },

  // Checks a password against the credential currently in effect: the admin_credentials
  // override hash if one has been set via changeAdminCredentials(), otherwise the
  // ADMIN_PASSWORD env var — so a fresh deployment with no override behaves exactly as
  // it did before this feature existed.
  async verifyCurrentPassword(password: string): Promise<boolean> {
    const credentials = await SettingsRepository.getCredentials()
    if (credentials.admin_password_hash) return verifyPassword(password, credentials.admin_password_hash)
    const envPassword = process.env.ADMIN_PASSWORD
    if (!envPassword) throw new AppError('Admin credentials not configured on server', 500)
    return timingSafeStringEqual(password, envPassword)
  },

  // Full login check (email + password) — used by /api/admin/auth/login instead of its
  // previous inline env-var-only comparison.
  async verifyAdminLogin(email: string, password: string): Promise<boolean> {
    const credentials = await SettingsRepository.getCredentials()
    const envEmail = process.env.ADMIN_EMAIL
    if (!envEmail) throw new AppError('Admin credentials not configured on server', 500)

    const effectiveEmail = credentials.admin_email ?? envEmail
    const emailOk = timingSafeStringEqual(email.toLowerCase(), effectiveEmail.toLowerCase())
    const passwordOk = await this.verifyCurrentPassword(password)

    return emailOk && passwordOk
  },

  // Deliberately does NOT touch the admin-token signing secret (still ADMIN_PASSWORD,
  // see /api/admin/auth/login/route.ts) — only the login credential changes, so the
  // admin's current session cookie keeps working after this call.
  async changeAdminCredentials(input: ChangeAdminCredentialsInput): Promise<void> {
    const currentlyValid = await this.verifyCurrentPassword(input.current_password)
    if (!currentlyValid) throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS')

    const patch: { admin_email?: string; admin_password_hash?: string } = {}
    if (input.new_email) patch.admin_email = input.new_email
    if (input.new_password) patch.admin_password_hash = hashPassword(input.new_password)
    if (Object.keys(patch).length === 0) return

    await SettingsRepository.updateCredentials(patch)
  },
}
