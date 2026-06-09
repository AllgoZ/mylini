/**
 * Reliably extracts a dynamic route segment from a Next.js API route URL.
 * Uses positional lookup keyed off a known segment name, so trailing slashes
 * and query strings cannot return an empty string.
 *
 * Example:
 *   extractParam('/api/admin/products/uuid-here/variants', 'products')
 *   → 'uuid-here'
 */
export function extractParam(url: string, segment: string): string {
  const clean = url.split('?')[0]
  const parts = clean.split('/')
  const idx = parts.lastIndexOf(segment)
  if (idx === -1 || idx + 1 >= parts.length) {
    throw new Error(`Segment '${segment}' not found in URL: ${url}`)
  }
  return parts[idx + 1]
}
