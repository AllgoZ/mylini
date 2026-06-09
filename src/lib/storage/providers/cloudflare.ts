import type { StorageProvider, UploadResult } from '../types'

export class CloudflareProvider implements StorageProvider {
  async upload(_buffer: Buffer, _key: string): Promise<UploadResult> {
    throw new Error('Cloudflare R2 provider not yet implemented')
  }

  async delete(_storageKey: string): Promise<void> {
    throw new Error('Cloudflare R2 provider not yet implemented')
  }

  getUrl(_storageKey: string): string {
    throw new Error('Cloudflare R2 provider not yet implemented')
  }
}
