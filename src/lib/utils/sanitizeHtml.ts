import DOMPurify from 'isomorphic-dompurify'

// Save-time sanitization for admin-authored rich text (product descriptions) before it
// reaches the database — the correct trust boundary, since this is where untrusted admin
// input enters the system. Allows the basic formatting tags the admin RichTextEditor
// actually produces; strips scripts/event handlers/iframes/etc.
export function sanitizeProductDescription(html: string): string {
  return DOMPurify.sanitize(html, {
    // Matches what the admin RichTextEditor's document.execCommand toolbar produces
    // (bold, italic, h3, unordered list) plus a few safe equivalents browsers may emit —
    // no style/class/script/iframe/event-handler attributes survive.
    ALLOWED_TAGS: ['p', 'div', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}
