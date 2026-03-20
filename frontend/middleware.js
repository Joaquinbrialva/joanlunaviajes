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

  // Proteger /cuenta — requiere login
  if (pathname.startsWith('/cuenta')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Si ya está logueado, no mostrar /login ni /registro
  if ((pathname === '/login' || pathname === '/registro') && token) {
    const payload = parseTokenPayload(token);
    if (payload) {
      const dest = STAFF_ROLES.includes(payload.role) ? '/admin' : '/cuenta';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/:path*', '/login', '/registro'],
};
