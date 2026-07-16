import { createClient } from '@/lib/db/server'
import type { HomepageSection, CreateHomepageSectionInput, UpdateHomepageSectionInput, HomepageSectionType } from '@/types/homepage'

// homepage_sections is defined in migration 029 — cast required until types are regenerated
async function db() {
  return (await createClient()) as any
}

export const HomepageRepository = {
  async findByType(type: HomepageSectionType): Promise<HomepageSection[]> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('section_type', type)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as HomepageSection[]
  },

  // Fetch several section types in one round trip (e.g. banner + promo_block for the
  // homepage) instead of one findByType() call per type. Ordered by type then sort_order
  // so filtering the result by type afterward preserves each type's internal ordering.
  async findByTypes(types: HomepageSectionType[]): Promise<HomepageSection[]> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .in('section_type', types)
      .eq('is_active', true)
      .order('section_type', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as HomepageSection[]
  },

  async findAll(): Promise<HomepageSection[]> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('section_type', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as HomepageSection[]
  },

  async findById(id: string): Promise<HomepageSection | null> {
    const supabase = await db()
    const { data } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    return data as HomepageSection | null
  },

  async create(input: CreateHomepageSectionInput): Promise<HomepageSection> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('homepage_sections')
      .insert(input)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as HomepageSection
  },

  async update(id: string, input: UpdateHomepageSectionInput): Promise<HomepageSection> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('homepage_sections')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Section not found')
    return data as HomepageSection
  },

  async remove(id: string): Promise<void> {
    const supabase = await db()
    const { error } = await supabase
      .from('homepage_sections')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async reorder(ids: string[]): Promise<void> {
    const supabase = await db()
    await Promise.all(
      ids.map((id, idx) =>
        supabase
          .from('homepage_sections')
          .update({ sort_order: idx, updated_at: new Date().toISOString() })
          .eq('id', id)
      )
    )
  },
}
