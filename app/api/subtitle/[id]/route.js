import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';

// GET /api/subtitle/:id
//
// Proxies the subtitle (.vtt) file server-side, same-origin, so the
// browser's <track> element can always load it regardless of whether
// the original host sends CORS headers.
export async function GET(req, { params }) {
  await connectDB();
  const movie = await Movie.findById(params.id).lean();
  if (!movie?.subtitleUrl) {
    return NextResponse.json({ error: 'No subtitles for this movie' }, { status: 404 });
  }

  const res = await fetch(movie.subtitleUrl);
  if (!res.ok) {
    return NextResponse.json({ error: 'Subtitle file unavailable' }, { status: 502 });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
