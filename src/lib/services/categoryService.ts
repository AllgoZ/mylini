import { CategoryRepository } from '@/lib/repositories/categoryRepository'

export const CategoryService = {
  async getWithChildren() {
    return CategoryRepository.findWithChildren()
  },

  async getBySlug(slug: string) {
    return CategoryRepository.findBySlug(slug)
  },
}
