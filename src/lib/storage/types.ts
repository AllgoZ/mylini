export interface UploadResult {
  public_url: string
  storage_key: string
  storage_provider: string
  width?: number
  height?: number
}

export interface StorageProvider {
  upload(buffer: Buffer, key: string): Promise<UploadResult>
  delete(storageKey: string): Promise<void>
  getUrl(storageKey: string, opts?: { width?: number; quality?: number }): string
}
