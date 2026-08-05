import type { Address } from '@/types/user'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getAddresses(): Promise<Address[]> {
  return apiFetch<Address[]>('/api/addresses')
}

export interface CreateAddressPayload {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default?: boolean
}

export async function createAddress(payload: CreateAddressPayload): Promise<Address> {
  return apiFetch<Address>('/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, country: 'India' }),
  })
}

export async function updateAddress(id: string, patch: Partial<CreateAddressPayload>): Promise<Address> {
  return apiFetch<Address>(`/api/addresses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}
