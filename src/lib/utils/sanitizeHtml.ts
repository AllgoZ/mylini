// Save-time sanitization for admin-authored rich text (product descriptions) before it
// reaches the database — the correct trust boundary, since this is where untrusted admin
// input enters the system. Allows the basic formatting tags the admin RichTextEditor
// actually produces; strips scripts/event handlers/iframes/etc.
//
// isomorphic-dompurify is imported dynamically, inside the function, rather than as a
// top-level import: this file is reachable from ProductService, which the public product-
// read paths (homepage, shop, product pages) also import for their own unrelated methods.
// A static top-level import here drags isomorphic-dompurify's jsdom dependency into every
// one of those routes' serverless bundles even though they never call this function —
// and jsdom failed to load in Vercel's bundled Node runtime for those routes ("Failed to
// load external module jsdom-...", crashing GET / with a 500 on every request). Loading it
// lazily means only the actual admin write path (ProductService.create/update) pulls it in.
export async function sanitizeProductDescription(html: string): Promise<string> {
  const { default: DOMPurify } = await import('isomorphic-dompurify')
  return DOMPurify.sanitize(html, {
    // Matches what the admin RichTextEditor's document.execCommand toolbar produces
    // (bold, italic, h3, unordered list) plus a few safe equivalents browsers may emit —
    // no style/class/script/iframe/event-handler attributes survive.
    ALLOWED_TAGS: ['p', 'div', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}
