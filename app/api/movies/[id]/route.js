import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { del } from '@vercel/blob';

// GET /api/movies/:id — public, movie details for the detail/player page
export async function GET(req, { params }) {
  await connectDB();
  const movie = await Movie.findById(params.id).lean();
  if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(movie);
}

// PUT /api/movies/:id — admin only, edit metadata
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  await connectDB();
  const movie = await Movie.findByIdAndUpdate(params.id, body, { new: true });
  if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(movie);
}

// DELETE /api/movies/:id — admin only, removes metadata AND the video file on Blob storage
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const movie = await Movie.findByIdAndDelete(params.id);
  if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await del(movie.videoUrl).catch(() => {}); // ignore if already missing

  return NextResponse.json({ success: true });
}
