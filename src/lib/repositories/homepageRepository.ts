import { createAdminClient } from '@/lib/db/admin'
import { createPublicClient } from '@/lib/db/publicClient'
import type { HomepageSection, CreateHomepageSectionInput, UpdateHomepageSectionInput, HomepageSectionType } from '@/types/homepage'

// homepage_sections is defined in migration 029 — cast required until types are regenerated.
// Public reads use the cookie-free client — server.ts's createClient() calls cookies(),
// which forces the homepage route fully dynamic and defeats `export const revalidate`.
function db() {
  return createPublicClient() as any
}

// Admin content-management methods (create/update/remove/reorder/findAll) use the
// service-role client — anon is read-only on homepage_sections (migration 031).
function adminDb() {
  return createAdminClient() as any
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
    const supabase = adminDb()
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('*')
      .order('section_type', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as HomepageSection[]
  },

  async findById(id: string): Promise<HomepageSection | null> {
    const supabase = adminDb()
    const { data } = await supabase
      .from('homepage_sections')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    return data as HomepageSection | null
  },

  async create(input: CreateHomepageSectionInput): Promise<HomepageSection> {
    const supabase = adminDb()
    const { data, error } = await supabase
      .from('homepage_sections')
      .insert(input)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as HomepageSection
  },

  async update(id: string, input: UpdateHomepageSectionInput): Promise<HomepageSection> {
    const supabase = adminDb()
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
    const supabase = adminDb()
    const { error } = await supabase
      .from('homepage_sections')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async reorder(ids: string[]): Promise<void> {
    const supabase = adminDb()
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
