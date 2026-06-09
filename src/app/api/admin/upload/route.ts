import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { storageProvider } from '@/lib/storage'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export const POST = requireAdmin(async (request, ctx) => {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const productId = (form.get('productId') as string | null) ?? `temp-${Date.now()}`
    const imageType = (form.get('type') as string | null) ?? 'gallery'

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPG, PNG, and WEBP images are accepted' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const baseKey = `products/${productId}/${imageType}-${timestamp}`

    // Main image — max 1200px wide, WebP quality 85
    const mainBuffer = await sharp(rawBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    // Thumbnail — 400px wide
    const thumbBuffer = await sharp(rawBuffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const [main, thumb] = await Promise.all([
      storageProvider.upload(mainBuffer, baseKey),
      storageProvider.upload(thumbBuffer, `${baseKey}-thumb`),
    ])

    return successResponse({ main, thumb }, 201)
  } catch (error) {
    return errorResponse(error)
  }
})
