import { createAdminClient } from '@/lib/db/admin'
import type { AboutPageContent } from '@/types/about'

// about_page_content postdates the last database.types.ts generation (migration 039) —
// same `as any` situation as otpRepository.ts/settingsRepository.ts. Singleton table
// (exactly one row, enforced by a unique index on a constant expression), service-role
// only — no anon/authenticated grant exists, so this must never be called from a
// client-facing request; the storefront About page reads it server-side only.

export const AboutRepository = {
  async get(): Promise<AboutPageContent> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.from('about_page_content').select('*').single()
    if (error) throw new Error(error.message)
    return data as AboutPageContent
  },

  async update(patch: Partial<Omit<AboutPageContent, 'id' | 'updated_at'>>): Promise<AboutPageContent> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any
    const current = await this.get()
    const { data, error } = await supabase
      .from('about_page_content')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', current.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as AboutPageContent
  },
}
