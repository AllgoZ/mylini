import { apiFetch } from './index'
import type { Category } from '@/types/product'

export async function adminCreateCategory(name: string, parentId?: string): Promise<Category> {
  return apiFetch<Category>('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId }),
  })
}
