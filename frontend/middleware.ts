import { NextURL } from 'next/dist/server/web/next-url';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/consume/:secret',
  ],
};

export default async function handler(req: NextRequest) {
  const secret = req.nextUrl.pathname.split('/')[2];

  if (secret) {
    req.nextUrl.pathname = '/consume';
    const response = NextResponse.redirect(req.nextUrl);
    response.cookies.set('secret', secret);

    return response;
  }
}
