import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifyToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.ADMIN_SECRET

  if (!token || !secret || !(await verifyToken(token, secret))) {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
