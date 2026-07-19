import { apiFetch } from './index'
import type { Category } from '@/types/product'
import type { UpdateCategoryInput } from '@/lib/validations/categorySchema'

export async function adminCreateCategory(name: string, parentId?: string): Promise<Category> {
  return apiFetch<Category>('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId }),
  })
}

export async function adminListCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/admin/categories')
}

export async function adminUpdateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
  return apiFetch<Category>(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function adminDeleteCategory(id: string): Promise<void> {
  await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
}
