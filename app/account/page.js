'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { uploadImageViaServer } from '@/lib/uploadWithTimeout';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import Avatar from '@/components/Avatar';

export default function AccountPage() {
  const { data: session, update } = useSession();
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileError, setProfileError] = useState('');

  async function loadLists() {
    const [wRes, hRes] = await Promise.all([
      fetch('/api/watchlist', { cache: 'no-store' }),
      fetch('/api/history', { cache: 'no-store' }),
    ]);
    setWatchlist(wRes.ok ? await wRes.json() : []);
    setHistory(hRes.ok ? await hRes.json() : []);
    setLoading(false);
  }

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (session?.user?.name) setNameInput(session.user.name);
  }, [session?.user?.name]);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileError('');

    try {
      let avatarUrl;
      if (avatarFile) {
        setAvatarUploading(true);
        const { url } = await uploadImageViaServer(avatarFile);
        avatarUrl = url;
        setAvatarUploading(false);
      }

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput, ...(avatarUrl ? { avatarUrl } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save.');
      }

      await update(); // refresh session so navbar/avatar update immediately
      setAvatarFile(null);
      setEditing(false);
    } catch (err) {
      setAvatarUploading(false);
      setProfileError(err.message);
    }
  }

  const firstName = session?.user?.name?.trim().split(/\s+/)[0];

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={session?.user?.name} avatarUrl={session?.user?.avatarUrl} size={56} />
            <div>
              <h1 className="font-display text-4xl tracking-wide">HI, {firstName?.toUpperCase()}</h1>
              <p className="text-muted text-sm mt-1">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-sm text-marquee hover:underline"
            >
              {editing ? 'Cancel' : 'Edit profile'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-muted hover:text-velvet"
            >
              Sign out
            </button>
          </div>
        </div>

        {editing && (
          <form onSubmit={saveProfile} className="mb-12 max-w-sm border border-white/10 rounded-md p-5 space-y-4">
            <label className="block">
              <span className="block text-sm text-muted mb-1">Name</span>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-muted mb-1">Profile photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marquee file:text-void file:font-medium"
              />
              {avatarFile && (
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="Preview"
                  className="mt-2 w-16 h-16 rounded-full object-cover"
                />
              )}
            </label>
            {profileError && <p className="text-velvet text-sm">{profileError}</p>}
            <button
              type="submit"
              disabled={avatarUploading}
              className="bg-marquee text-void font-display tracking-wide px-5 py-2 rounded-md hover:brightness-110 disabled:opacity-50"
            >
              {avatarUploading ? 'SAVING…' : 'SAVE'}
            </button>
          </form>
        )}

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
