import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // /admin/* requires the admin role specifically — a signed-in
    // regular viewer must NOT be able to reach the dashboard/upload pages.
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // /account/* is for signed-in viewers (their watchlist/history) — an
    // admin session shouldn't wander in here either, keeps the two worlds separate.
    if (pathname.startsWith('/account') && role !== 'user') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/upload/:path*', '/account/:path*'],
};
