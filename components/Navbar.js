'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-display text-3xl tracking-wide text-marquee">
          REEL<span className="text-bone">HOUSE</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          {status === 'authenticated' && session.user.role === 'user' ? (
            <>
              <Link href="/account" className="text-muted hover:text-bone transition-colors">
                My account
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-muted hover:text-velvet transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-bone transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-marquee text-void font-medium px-3 py-1.5 rounded-md hover:brightness-110 transition"
              >
                Sign up
              </Link>
            </>
          )}
          <Link href="/admin/login" className="text-muted/60 hover:text-muted transition-colors text-xs">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
