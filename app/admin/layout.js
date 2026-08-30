'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

function NavLink({ href, children }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm font-body transition-colors ${
        active ? 'bg-marquee text-void font-medium' : 'text-muted hover:text-bone'
      }`}
    >
      {children}
    </Link>
  );
}

export default function AdminDashboardLayout({ children }) {
  const pathname = usePathname();

  // The login page renders its own centered layout — no sidebar chrome.
  if (pathname === '/admin/login') return children;

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-white/10 p-5 flex flex-col">
        <span className="font-display text-2xl tracking-wide text-marquee mb-8">
          REEL<span className="text-bone">HOUSE</span>
        </span>
        <nav className="space-y-1 flex-1">
          <NavLink href="/admin/dashboard">Dashboard</NavLink>
          <NavLink href="/admin/upload">Upload Movie</NavLink>
          <NavLink href="/admin/settings">Settings</NavLink>
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-muted hover:text-velvet text-left"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
