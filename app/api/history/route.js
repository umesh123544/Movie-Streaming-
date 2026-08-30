import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/history — the signed-in viewer's recently watched movies
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .populate('history.movie')
    .lean();

  const history = (user?.history || [])
    .filter((h) => h.movie) // drop entries whose movie was deleted
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));

  return NextResponse.json(history);
}

// POST /api/history  { movieId } — record that the viewer started watching a movie.
// Called once when playback starts (see VideoPlayer.js).
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    // Not signed in — silently no-op rather than erroring, since watching
    // without an account is allowed, it just isn't tracked.
    return NextResponse.json({ tracked: false });
  }

  const { movieId } = await req.json();
  if (!movieId) return NextResponse.json({ error: 'movieId required' }, { status: 400 });

  await connectDB();
  // Drop any existing entry for this movie, then push a fresh one on top —
  // keeps history ordered by most-recently-watched without duplicates.
  await User.findByIdAndUpdate(session.user.id, {
    $pull: { history: { movie: movieId } },
  });
  await User.findByIdAndUpdate(session.user.id, {
    $push: { history: { movie: movieId, watchedAt: new Date() } },
  });

  return NextResponse.json({ tracked: true });
}
