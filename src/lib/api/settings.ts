import type { PublicStoreSettings } from '@/types/settings'

export async function getPublicSettings(): Promise<PublicStoreSettings> {
  const res = await fetch('/api/settings')
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load settings')
  return json.data as PublicStoreSettings
}
