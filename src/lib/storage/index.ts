import { CloudinaryProvider } from './providers/cloudinary'
import { CloudflareProvider } from './providers/cloudflare'
import type { StorageProvider } from './types'

const PROVIDER = process.env.STORAGE_PROVIDER ?? 'cloudinary'

export const storageProvider: StorageProvider = PROVIDER === 'cloudflare'
  ? new CloudflareProvider()
  : new CloudinaryProvider()

export type { UploadResult, StorageProvider } from './types'
