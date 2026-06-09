export type HomepageSectionType = 'banner' | 'promo_block' | 'featured_category'

export interface HomepageSection {
  id: string
  section_type: HomepageSectionType
  title: string | null
  subtitle: string | null
  body_text: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  badge_text: string | null
  sort_order: number
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CreateHomepageSectionInput = Omit<HomepageSection, 'id' | 'created_at' | 'updated_at'>
export type UpdateHomepageSectionInput = Partial<CreateHomepageSectionInput>
