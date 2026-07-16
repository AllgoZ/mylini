import { HomepageRepository } from '@/lib/repositories/homepageRepository'
import type { HomepageSection, CreateHomepageSectionInput, UpdateHomepageSectionInput, HomepageSectionType } from '@/types/homepage'

export const HomepageService = {
  async getByType(type: HomepageSectionType): Promise<HomepageSection[]> {
    return HomepageRepository.findByType(type)
  },

  async getByTypes(types: HomepageSectionType[]): Promise<HomepageSection[]> {
    return HomepageRepository.findByTypes(types)
  },

  async getAll(): Promise<HomepageSection[]> {
    return HomepageRepository.findAll()
  },

  async create(input: CreateHomepageSectionInput): Promise<HomepageSection> {
    return HomepageRepository.create(input)
  },

  async update(id: string, input: UpdateHomepageSectionInput): Promise<HomepageSection> {
    return HomepageRepository.update(id, input)
  },

  async remove(id: string): Promise<void> {
    return HomepageRepository.remove(id)
  },

  async reorder(ids: string[]): Promise<void> {
    return HomepageRepository.reorder(ids)
  },
}
