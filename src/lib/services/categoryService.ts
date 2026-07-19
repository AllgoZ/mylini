import { CategoryRepository } from '@/lib/repositories/categoryRepository'

export const CategoryService = {
  async getWithChildren() {
    return CategoryRepository.findWithChildren()
  },

  async getBySlug(slug: string) {
    return CategoryRepository.findBySlug(slug)
  },

  async create(name: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return CategoryRepository.create(name, slug, parentId)
  },

  async getAllForAdmin() {
    return CategoryRepository.findAllForAdmin()
  },

  async update(id: string, patch: Parameters<typeof CategoryRepository.update>[1]) {
    return CategoryRepository.update(id, patch)
  },

  async remove(id: string) {
    return CategoryRepository.remove(id)
  },
}
