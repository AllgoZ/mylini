import { apiFetch } from './index'
import type { DashboardStats } from '@/lib/services/adminStatsService'

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/admin/stats')
}
