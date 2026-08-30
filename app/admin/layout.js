'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

function NavLink({ href, children, onNavigate }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
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
  const [menuOpen, setMenuOpen] = useState(false);

  // The login page renders its own centered layout — no sidebar chrome.
  if (pathname === '/admin/login') return children;

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar — only visible below md breakpoint */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-display text-xl tracking-wide text-marquee">
          REEL<span className="text-bone">HOUSE</span>
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 text-bone"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Backdrop, mobile only, shown when menu is open */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar — static on desktop, slide-in drawer on mobile */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-64 md:w-56 z-50
          border-r border-white/10 p-5 flex flex-col bg-void
          transition-transform duration-200
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="font-display text-2xl tracking-wide text-marquee">
            REEL<span className="text-bone">HOUSE</span>
          </span>
          <button
            onClick={closeMenu}
            aria-label="Close menu"
            className="md:hidden p-1 text-muted"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1 flex-1">
          <NavLink href="/admin/dashboard" onNavigate={closeMenu}>Dashboard</NavLink>
          <NavLink href="/admin/upload" onNavigate={closeMenu}>Upload Movie</NavLink>
          <NavLink href="/admin/settings" onNavigate={closeMenu}>Settings</NavLink>
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-sm text-muted hover:text-velvet text-left"
        >
          Sign out
        </button>
      </aside>

      <div className="flex-1 p-6 md:p-8">{children}</div>
    </div>
  );
}
