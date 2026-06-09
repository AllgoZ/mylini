import { createClient } from '@/lib/db/server'
import { NotFoundError } from '@/lib/utils/errors'
import type { Category } from '@/types/product'

export type CategoryTree = Category & { children: CategoryTree[] }

export const CategoryRepository = {
  async findAll(): Promise<Category[]> {
    const supabase = await createClient()
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
    const supabase = await createClient()
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
    const supabase = await createClient()
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
}
