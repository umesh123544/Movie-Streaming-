import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Movie from '@/models/Movie';

export const runtime = 'nodejs';

// GET /api/stream/:id
//
// Proxies video playback from Vercel Blob storage. The client's <video>
// tag only ever sees this URL (keyed by the movie's Mongo _id) — the
// real Blob URL is fetched server-side and never sent to the browser
// directly, so there's no direct file link to copy or hot-link.
//
// Forwards the browser's Range header to Blob storage (which supports
// range requests natively, since it's served over a CDN) so seeking/
// scrubbing in the player still works, and relays Blob's 206/200
// response straight back through.
//
// IMPORTANT CAVEAT: this stops casual "right click > save" downloading
// and hot-linking, but it cannot make a video 100% impossible to
// capture — anyone who can play a video in a browser can, with enough
// effort, screen-record it. True DRM (Widevine/FairPlay) is the only
// stronger option, and is a much bigger, usually paid, undertaking.
export async function GET(req, { params }) {
  await connectDB();
  const movie = await Movie.findById(params.id).lean();
  if (!movie) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Optional ?quality=720p — falls back to the default videoUrl if not
  // provided or not found among this movie's alternate qualities.
  const requestedQuality = req.nextUrl.searchParams.get('quality');
  const match = requestedQuality
    ? movie.qualities?.find((q) => q.label === requestedQuality)
    : null;
  const sourceUrl = match ? match.url : movie.videoUrl;

  const range = req.headers.get('range');

  const blobRes = await fetch(sourceUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!blobRes.ok && blobRes.status !== 206) {
    return NextResponse.json({ error: 'Video file unavailable' }, { status: 502 });
  }

  const headers = new Headers();
  headers.set('Content-Type', blobRes.headers.get('content-type') || 'video/mp4');
  headers.set('Content-Disposition', 'inline');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'no-store');
  if (blobRes.headers.get('content-range')) {
    headers.set('Content-Range', blobRes.headers.get('content-range'));
  }
  if (blobRes.headers.get('content-length')) {
    headers.set('Content-Length', blobRes.headers.get('content-length'));
  }

  return new NextResponse(blobRes.body, {
    status: blobRes.status,
    headers,
  });
}
