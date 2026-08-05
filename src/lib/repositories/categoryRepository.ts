import { createAdminClient } from '@/lib/db/admin'
import { createPublicClient } from '@/lib/db/publicClient'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Category } from '@/types/product'

export type CategoryTree = Category & { children: CategoryTree[] }

export const CategoryRepository = {
  async findAll(): Promise<Category[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, is_active, sort_order')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data as unknown as Category[]
  },

  async findBySlug(slug: string): Promise<Category> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, is_active, sort_order')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (error || !data) throw new NotFoundError(`Category '${slug}'`)
    return data as unknown as Category
  },

  async create(name: string, slug: string, parentId?: string): Promise<Category> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, is_active: true, sort_order: 0, ...(parentId ? { parent_id: parentId } : {}) } as any)
      .select('id, name, slug, parent_id, is_active, sort_order')
      .single()
    if (error) throw new Error(error.message)
    return data as unknown as Category
  },

  async findWithChildren(): Promise<CategoryTree[]> {
    const all = await this.findAll()
    const map = new Map<string, CategoryTree>()

    all.forEach((cat) => map.set(cat.id, { ...cat, children: [] }))

    const roots: CategoryTree[] = []
    map.forEach((cat) => {
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(cat)
      } else {
        roots.push(cat)
      }
    })

    return roots
  },

  // Admin management view — includes inactive categories (findAll() above is the
  // public storefront read, active-only). Admin client, since this is never reachable
  // from a public route.
  async findAllForAdmin(): Promise<Category[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, is_active, sort_order')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data as unknown as Category[]
  },

  async update(id: string, patch: Partial<{ name: string; slug: string; image_url: string | null; is_active: boolean; sort_order: number; parent_id: string | null }>): Promise<Category> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select('id, name, slug, parent_id, image_url, is_active, sort_order')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Category not found')
    return data as unknown as Category
  },

  // Soft delete, matching the product/variant convention — categories.category_id has
  // ON DELETE RESTRICT from products, so a real DELETE would fail loudly anyway once
  // any product uses it; the explicit checks below give a clear message earlier for
  // both that case and the (unconstrained) has-children case.
  async remove(id: string): Promise<void> {
    const supabase = createAdminClient()

    const { count: childCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id)
      .is('deleted_at', null)
    if (childCount && childCount > 0) {
      throw new ValidationError('This category still has sub-categories — delete or move those first.')
    }

    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null)
    if (productCount && productCount > 0) {
      throw new ValidationError('This category still has products assigned — reassign them first.')
    }

    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
