import { requireAdmin } from '@/lib/middleware/adminMiddleware'
import { createAdminClient } from '@/lib/db/admin'
import { successResponse, errorResponse } from '@/lib/utils/apiResponse'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'cms-images'

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

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const supabase = createAdminClient()

    // Ensure bucket exists (idempotent — no-ops if already there)
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_BYTES })
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(key)

    return successResponse({ url: publicUrl })
  } catch (error) {
    return errorResponse(error)
  }
})
