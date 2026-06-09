import { HomepageService } from '@/lib/services/homepageService'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import type { HomepageSectionType } from '@/types/homepage'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as HomepageSectionType | null
    const sections = type
      ? await HomepageService.getByType(type)
      : await HomepageService.getAll()
    return successResponse(sections)
  } catch (error) {
    return errorResponse(error)
  }
}
