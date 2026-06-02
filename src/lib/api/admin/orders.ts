import { apiFetch } from './index'
import type { AdminOrderRow } from '@/lib/repositories/orderRepository'
import type { Order, OrderWithItems, OrderStatus } from '@/types/order'

export async function adminGetOrders(filters: { status?: string; page?: number; limit?: number } = {}): Promise<{ orders: AdminOrderRow[]; count: number }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  return apiFetch<{ orders: AdminOrderRow[]; count: number }>(`/api/admin/orders?${params}`)
}

export async function adminGetOrder(id: string): Promise<OrderWithItems> {
  return apiFetch<OrderWithItems>(`/api/admin/orders/${id}`)
}

export async function adminUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiFetch<Order>(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
