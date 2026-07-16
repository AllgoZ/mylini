import type { User } from '@/types/user'
import type { OrderSummary } from '@/types/order'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getMe(): Promise<User | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' })
  const json = await res.json()
  if (!res.ok) return null
  return json.data as User | null
}

export async function loginByPhone(phone: string): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Login failed')
  return (json.data as { user: User }).user
}

export async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}

export async function getOrders(): Promise<OrderSummary[]> {
  return apiFetch<OrderSummary[]>('/api/orders')
}

export async function getOrderById(id: string): Promise<import('@/types/order').OrderWithItems> {
  return apiFetch(`/api/orders/${id}`)
}
