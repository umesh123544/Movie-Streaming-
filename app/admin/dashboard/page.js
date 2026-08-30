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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl tracking-wide">DASHBOARD</h1>
          <p className="text-muted text-sm mt-1">{movies.length} movie{movies.length !== 1 ? 's' : ''} in the library</p>
        </div>
        <Link
          href="/admin/upload"
          className="bg-marquee text-void font-display tracking-wide px-5 py-2 rounded-md hover:brightness-110"
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
        <div className="overflow-hidden rounded-md border border-white/10">
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
                  <td className="px-4 py-3 text-right space-x-3">
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
      )}
    </div>
  );
}
