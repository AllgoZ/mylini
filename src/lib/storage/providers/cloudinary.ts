import { v2 as cloudinary } from 'cloudinary'
import type { StorageProvider, UploadResult } from '../types'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
})

export class CloudinaryProvider implements StorageProvider {
  async upload(buffer: Buffer, key: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: key,
          overwrite: true,
          resource_type: 'image',
          format: 'webp',
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve({
            public_url: result.secure_url,
            storage_key: result.public_id,
            storage_provider: 'cloudinary',
            width: result.width,
            height: result.height,
          })
        }
      )
      stream.end(buffer)
    })
  }

  async delete(storageKey: string): Promise<void> {
    await cloudinary.uploader.destroy(storageKey)
  }

  getUrl(storageKey: string, opts: { width?: number; quality?: number } = {}): string {
    return cloudinary.url(storageKey, {
      fetch_format: 'auto',
      quality: opts.quality ?? 'auto',
      width: opts.width,
      crop: opts.width ? 'limit' : undefined,
    })
  }
}
