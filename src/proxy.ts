import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/middleware/adminMiddleware'

// Server-side gate for the /admin page shell — the API routes were already protected by
// requireAdmin() (adminMiddleware.ts), but the page itself only checked auth client-side
// (a useEffect fetching /api/admin/stats), so unauthenticated visitors' browsers still
// downloaded and started rendering the admin shell before the check resolved. This
// redirects before any of that ships. Next 16's Proxy defaults to the Node.js runtime
// (no config needed — setting `runtime` here would actually throw), so the same
// node:crypto-based verifyAdminToken used by the API routes works unchanged here too.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const token = request.cookies.get('admin_token')?.value

  const authenticated = !!adminPassword && !!token && !!verifyAdminToken(token, adminPassword)

  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
