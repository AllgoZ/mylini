import { apiFetch } from './index'
import type { CustomerWithStats } from '@/lib/repositories/userRepository'

export async function adminGetCustomers(filters: { search?: string; page?: number; limit?: number } = {}): Promise<{ users: CustomerWithStats[]; count: number }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  return apiFetch<{ users: CustomerWithStats[]; count: number }>(`/api/admin/customers?${params}`)
}
