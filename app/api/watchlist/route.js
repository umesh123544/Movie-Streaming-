import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET /api/watchlist — the signed-in viewer's saved movies
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).populate('watchlist').lean();
  return NextResponse.json(user?.watchlist || []);
}

// POST /api/watchlist  { movieId } — add a movie
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { movieId } = await req.json();
  if (!movieId) return NextResponse.json({ error: 'movieId required' }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { $addToSet: { watchlist: movieId } });

  return NextResponse.json({ success: true });
}

// DELETE /api/watchlist  { movieId } — remove a movie
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { movieId } = await req.json();
  if (!movieId) return NextResponse.json({ error: 'movieId required' }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { $pull: { watchlist: movieId } });

  return NextResponse.json({ success: true });
}
