import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './generated/database.types'

// Anon-key client for public, unauthenticated reads (catalog, categories, homepage
// sections). Deliberately does NOT call cookies() — server.ts's createClient() does,
// and Next.js forces a route fully dynamic the moment cookies() is called anywhere in
// its render tree, silently overriding `export const revalidate`. Public reads never
// use the cookie value anyway, so this restores the ISR caching that revalidate = 60
// was always meant to provide on /, /product/[slug], /shop/[category].
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
