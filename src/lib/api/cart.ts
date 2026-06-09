import type { CartWithItems } from '@/types/cart'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, credentials: 'include' })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed')
  return json.data as T
}

export async function getCart(sessionId: string): Promise<CartWithItems> {
  return apiFetch<CartWithItems>(`/api/cart?session_id=${encodeURIComponent(sessionId)}`)
}

export async function addToCart(
  sessionId: string,
  variantId: string,
  quantity: number
): Promise<CartWithItems> {
  return apiFetch<CartWithItems>('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, variant_id: variantId, quantity }),
  })
}

export async function updateCartItem(
  sessionId: string,
  variantId: string,
  quantity: number
): Promise<CartWithItems> {
  return apiFetch<CartWithItems>('/api/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, variant_id: variantId, quantity }),
  })
}

export async function removeCartItem(
  sessionId: string,
  variantId: string
): Promise<CartWithItems> {
  return apiFetch<CartWithItems>('/api/cart', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, variant_id: variantId }),
  })
}

export async function clearCart(sessionId: string): Promise<void> {
  await apiFetch<null>('/api/cart', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })
}
