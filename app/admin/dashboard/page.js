'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMovies() {
    setLoading(true);
    const res = await fetch('/api/movies');
    const data = await res.json();
    setMovies(data);
    setLoading(false);
  }

  useEffect(() => {
    loadMovies();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this movie and its video file? This cannot be undone.')) return;
    const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } else {
      alert('Failed to delete movie.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-wide">DASHBOARD</h1>
          <p className="text-muted text-sm mt-1">{movies.length} movie{movies.length !== 1 ? 's' : ''} in the library</p>
        </div>
        <Link
          href="/admin/upload"
          className="bg-marquee text-void font-display tracking-wide px-5 py-2 rounded-md hover:brightness-110 text-center"
        >
          + UPLOAD MOVIE
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : movies.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-md p-12 text-center text-muted">
          No movies yet. Upload your first one.
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards, with Edit/Delete always visible (no horizontal scrolling needed) */}
          <div className="md:hidden space-y-3">
            {movies.map((movie) => (
              <div key={movie._id} className="border border-white/10 rounded-md p-3 flex gap-3">
                <img src={movie.posterUrl} alt="" className="w-14 h-20 object-cover rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-bone font-medium truncate">{movie.title}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {movie.genre}{movie.year ? ` · ${movie.year}` : ''} · {movie.views} views
                  </p>
                  <div className="flex gap-4 mt-3">
                    <Link href={`/movie/${movie._id}`} className="text-marquee text-sm hover:underline">
                      View
                    </Link>
                    <Link href={`/admin/edit/${movie._id}`} className="text-bone text-sm hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(movie._id)}
                      className="text-velvet text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-hidden rounded-md border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-surface text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Poster</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Genre</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie._id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <img src={movie.posterUrl} alt="" className="w-10 h-14 object-cover rounded" />
                    </td>
                    <td className="px-4 py-3">{movie.title}</td>
                    <td className="px-4 py-3 text-muted">{movie.genre}</td>
                    <td className="px-4 py-3 text-muted">{movie.year || '—'}</td>
                    <td className="px-4 py-3 text-muted">{movie.views}</td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <Link href={`/movie/${movie._id}`} className="text-marquee hover:underline">
                        View
                      </Link>
                      <Link href={`/admin/edit/${movie._id}`} className="text-bone hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(movie._id)}
                        className="text-velvet hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
