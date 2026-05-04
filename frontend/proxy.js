import { NextResponse } from 'next/server';

const STAFF_ROLES = ['admin', 'agent'];

function parseTokenPayload(token) {
  try {
    const base64 = token.split('.')[1];
    const json = Buffer.from(base64, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? parseTokenPayload(token) : null;

  // Proteger rutas /admin — requiere login y rol staff
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!payload || !STAFF_ROLES.includes(payload.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Si ya está logueado, no mostrar /login
  if (pathname === '/login' && token && payload) {
    const dest = STAFF_ROLES.includes(payload.role) ? '/admin' : '/';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
