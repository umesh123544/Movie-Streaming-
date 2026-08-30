'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';

export default function AccountPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [wRes, hRes] = await Promise.all([
        fetch('/api/watchlist'),
        fetch('/api/history'),
      ]);
      setWatchlist(await wRes.json());
      setHistory(await hRes.json());
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-wide">MY ACCOUNT</h1>
            <p className="text-muted text-sm mt-1">{session?.user?.name}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-muted hover:text-velvet"
          >
            Sign out
          </button>
        </div>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="font-display text-2xl tracking-wide mb-4">MY WATCHLIST</h2>
              {watchlist.length === 0 ? (
                <p className="text-muted text-sm">
                  Nothing saved yet — tap "Add to watchlist" on any movie page.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {watchlist.map((movie) => (
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-display text-2xl tracking-wide mb-4">RECENTLY WATCHED</h2>
              {history.length === 0 ? (
                <p className="text-muted text-sm">You haven't watched anything yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {history.map((h) => (
                    <MovieCard key={h.movie._id} movie={h.movie} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
