import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';

// GET /api/movies — public, list all movies (for the homepage grid)
export async function GET() {
  await connectDB();
  const movies = await Movie.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(movies);
}

// POST /api/movies — admin only, create a movie metadata entry
// (video file itself is uploaded separately via /api/upload)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, genre, year, posterUrl, videoUrl, subtitleUrl, qualities } = body;

  if (!title || !description || !genre || !posterUrl || !videoUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();
  const movie = await Movie.create({
    title,
    description,
    genre,
    year,
    posterUrl,
    videoUrl,
    subtitleUrl: subtitleUrl || undefined,
    qualities: Array.isArray(qualities) ? qualities.filter((q) => q.label && q.url) : [],
  });

  return NextResponse.json(movie, { status: 201 });
}
