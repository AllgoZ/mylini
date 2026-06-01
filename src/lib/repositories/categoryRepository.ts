import { createClient } from '@/lib/db/server'
import { NotFoundError } from '@/lib/utils/errors'
import type { Category } from '@/types/product'

export type CategoryTree = Category & { children: CategoryTree[] }

export const CategoryRepository = {
  async findAll(): Promise<Category[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data
  },

  async findBySlug(slug: string): Promise<Category> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (error || !data) throw new NotFoundError(`Category '${slug}'`)
    return data
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
