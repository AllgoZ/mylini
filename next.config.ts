import type { NextConfig } from "next";

// Scoped to what's actually in use — the image domains here match images.remotePatterns
// below exactly, nothing broader. style-src needs 'unsafe-inline': Tailwind/Framer
// Motion inject inline style attributes throughout this codebase (verified), so removing
// it would break the app, not harden it.
//
// script-src: 'unsafe-inline' is needed in BOTH dev and prod — the App Router streams RSC
// payloads via inline <script>self.__next_f.push(...)</script> tags with no nonce, so
// without it hydration breaks in production too, not just dev. This matches Next's own
// official "without nonces" CSP example. A nonce-based CSP (via proxy.ts) could drop
// 'unsafe-inline', but requires forcing every page into dynamic rendering — that would
// undo the ISR caching Phase 1 added specifically for performance, so it's not used here.
// 'unsafe-eval' is dev-only: Next's CSP guide is explicit that React uses eval() in
// development to reconstruct server-side error stacks in the browser — without it, dev
// mode's Fast Refresh/HMR breaks and the app never becomes interactive (this is exactly
// what happened: pages server-rendered fine, but all client JS silently failed under CSP).
// Not needed in production — Next/React don't use eval() there.
const isDev = process.env.NODE_ENV === 'development'
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: — admin image uploaders (ImageUploader.tsx) preview the just-picked file via
  // URL.createObjectURL() before/while it uploads; without blob: here the browser
  // silently refuses to paint that <img>, showing a broken-image icon instead of the
  // upload-in-progress preview.
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://images.unsplash.com https://*.r2.cloudflarestorage.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Cloudflare R2 public bucket
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      // Supabase Storage fallback
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
