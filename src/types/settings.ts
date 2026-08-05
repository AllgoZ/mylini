// Manually typed — admin_credentials/store_settings postdate the last
// database.types.ts generation (migration 037), same situation as otps/rate_limits
// (see otpRepository.ts). Regenerate types and drop these once convenient.

export type AdminCredentials = {
  id: string
  admin_email: string | null
  admin_password_hash: string | null
  updated_at: string
}

export type StoreSettings = {
  id: string
  shipping_charge: number
  free_shipping_threshold: number
  tax_rate: number
  maintenance_mode: boolean
  maintenance_message: string | null
  store_name: string
  store_email: string | null
  store_phone: string | null
  store_address: string | null
  order_notification_email: string | null
  updated_at: string
}

// The only subset ever exposed to an unauthenticated storefront request
// (GET /api/settings) — never admin_credentials, never the full store_settings row.
export type PublicStoreSettings = Pick<
  StoreSettings,
  'shipping_charge' | 'free_shipping_threshold' | 'tax_rate' | 'maintenance_mode' | 'maintenance_message' | 'store_name'
>

// What the admin settings form gets — the full operational row, plus whether a
// credential override is currently set (never the hash itself).
export type AdminSettingsView = StoreSettings & {
  admin_email_override: string | null
  has_password_override: boolean
}
