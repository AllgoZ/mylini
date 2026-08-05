import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { storageProvider } from '@/lib/storage'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export const POST = requireAdmin(async (request) => {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string | null) ?? 'general'

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, WebP, and GIF files are allowed' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const key = `cms/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Wide banners/promo images — cap at 1600px wide, same resize-then-Cloudinary-upload
    // pattern as product images (src/app/api/admin/upload/route.ts), via the shared
    // storageProvider abstraction instead of Supabase Storage.
    const optimized = await sharp(rawBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const result = await storageProvider.upload(optimized, key)

    return successResponse({ url: result.public_url })
  } catch (error) {
    return errorResponse(error)
  }
})
