import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import Navbar from '@/components/Navbar';
import MarqueeStrip from '@/components/MarqueeStrip';
import MovieCard from '@/components/MovieCard';

export const dynamic = 'force-dynamic'; // always show latest uploads

async function getMovies() {
  await connectDB();
  const movies = await Movie.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(movies));
}

export default async function HomePage() {
  const movies = await getMovies();

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <MarqueeStrip />
        <h1 className="font-display text-5xl tracking-wide mt-2 mb-1">NOW SHOWING</h1>
        <p className="text-muted mb-8">{movies.length} title{movies.length !== 1 ? 's' : ''} in the house</p>

        {movies.length === 0 ? (
          <div className="border border-dashed border-white/15 rounded-md p-12 text-center text-muted">
            No movies uploaded yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
