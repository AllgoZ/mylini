// Sanity CMS — read-only client for marketing content, blogs, and landing pages.
// Install: npm install next-sanity @sanity/image-url

const config = {
  projectId: process.env.SANITY_PROJECT_ID ?? '',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
}

// TODO: import { createClient } from 'next-sanity'
// export const sanityClient = createClient(config)

export const sanityConfig = config

export async function sanityFetch<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T> {
  // TODO: return sanityClient.fetch<T>(query, params ?? {})
  console.log('[Sanity stub] fetch:', query, params)
  return null as T
}
