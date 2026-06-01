// Cloudflare R2 — object storage for product images.
// Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// R2 is S3-compatible — uses AWS SDK pointed at R2 endpoint.

const r2Config = {
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ?? '',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY ?? '',
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY ?? '',
  bucket: process.env.CLOUDFLARE_R2_BUCKET ?? '',
  region: 'auto',
}

// TODO:
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
// export const r2Client = new S3Client({
//   endpoint: r2Config.endpoint,
//   region: r2Config.region,
//   credentials: { accessKeyId: r2Config.accessKeyId, secretAccessKey: r2Config.secretAccessKey },
// })

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  // TODO: implement PutObjectCommand
  console.log('[R2 stub] upload:', key, contentType)
  return `https://${r2Config.bucket}.r2.cloudflarestorage.com/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  // TODO: implement DeleteObjectCommand
  console.log('[R2 stub] delete:', key)
}

export function getR2PublicUrl(key: string): string {
  return `https://${r2Config.bucket}.r2.cloudflarestorage.com/${key}`
}
