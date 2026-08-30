import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import WatchlistButton from '@/components/WatchlistButton';

async function getMovie(id) {
  await connectDB();
  const movie = await Movie.findById(id).lean().catch(() => null);
  if (!movie) return null;
  return JSON.parse(JSON.stringify(movie));
}

export default async function MoviePage({ params }) {
  const movie = await getMovie(params.id);
  if (!movie) return notFound();

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <VideoPlayer movieId={movie._id} posterUrl={movie.posterUrl} title={movie.title} />

        <div className="mt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-4xl tracking-wide">{movie.title}</h1>
              <p className="text-muted text-sm mt-1">
                {movie.genre}{movie.year ? ` · ${movie.year}` : ''}
              </p>
            </div>
            <WatchlistButton movieId={movie._id} />
          </div>
          <p className="text-bone/90 mt-4 leading-relaxed max-w-3xl">{movie.description}</p>
        </div>
      </main>
    </>
  );
}
