'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function WatchlistButton({ movieId }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || session.user.role !== 'user') {
      setChecking(false);
      return;
    }
    setChecking(true);
    fetch('/api/watchlist', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setSaved(arr.some((m) => String(m._id) === String(movieId)));
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [status, session, movieId]);

  async function toggle() {
    if (status !== 'authenticated' || session.user.role !== 'user') {
      router.push('/login');
      return;
    }

    setBusy(true);
    const wasSaved = saved;
    const method = wasSaved ? 'DELETE' : 'POST';
    const res = await fetch('/api/watchlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId }),
    });
    if (res.ok) setSaved(!wasSaved);
    setBusy(false);
  }

  if (checking) return null;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-sm font-medium px-4 py-2 rounded-md border transition ${
        saved
          ? 'bg-marquee text-void border-marquee'
          : 'border-white/20 text-bone hover:border-marquee hover:text-marquee'
      } disabled:opacity-50`}
    >
      {saved ? '✓ In watchlist' : '+ Add to watchlist'}
    </button>
  );
}
