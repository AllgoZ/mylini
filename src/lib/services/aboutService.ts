import { AboutRepository } from '@/lib/repositories/aboutRepository'
import type { AboutPageContent } from '@/types/about'

export const AboutService = {
  async get(): Promise<AboutPageContent> {
    return AboutRepository.get()
  },

  async update(patch: Partial<Omit<AboutPageContent, 'id' | 'updated_at'>>): Promise<AboutPageContent> {
    return AboutRepository.update(patch)
  },
}
