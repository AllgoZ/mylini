// Validates all required environment variables at startup.
// Throws on missing server-side vars to fail fast instead of crashing at runtime.

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    // Used to sign short-lived JWTs so authenticated (logged-in-user) Supabase requests carry
    // a real auth.uid() for RLS — see src/lib/db/authenticatedClient.ts. From the Supabase
    // dashboard: Settings -> API -> JWT Settings.
    jwtSecret: requireEnv('SUPABASE_JWT_SECRET'),
  },
  admin: {
    email: requireEnv('ADMIN_EMAIL'),
    password: requireEnv('ADMIN_PASSWORD'),
  },
  r2: {
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ?? '',
    accessKey: process.env.CLOUDFLARE_R2_ACCESS_KEY ?? '',
    secretKey: process.env.CLOUDFLARE_R2_SECRET_KEY ?? '',
    bucket: process.env.CLOUDFLARE_R2_BUCKET ?? '',
  },
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID ?? '',
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiToken: process.env.SANITY_API_TOKEN ?? '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
  },
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
  },
} as const
