import { NextResponse } from 'next/server';

const STAFF_ROLES = ['admin', 'agent', 'designer'];

function parseTokenPayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = Buffer.from(base64, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Proteger rutas /admin
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const payload = parseTokenPayload(token);
    if (!payload || !STAFF_ROLES.includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Si ya está logueado, no mostrar /login
  if (pathname === '/login' && token) {
    const payload = parseTokenPayload(token);
    if (payload) {
      const dest = STAFF_ROLES.includes(payload.role) ? '/admin' : '/';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
