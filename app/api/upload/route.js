import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import path from 'path';

export const runtime = 'nodejs';

// POST /api/upload — admin only. Accepts multipart/form-data with a
// "video" file field, uploads it to Vercel Blob storage (a serverless
// deployment's own filesystem is read-only/ephemeral, so local disk
// storage doesn't survive between requests — Blob storage is the
// persistent equivalent). Returns the resulting public Blob URL, which
// gets saved on the Movie document as `videoUrl`. That URL is never
// sent to visitors directly — playback always goes through
// /api/stream/[movieId], which fetches from it server-side.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('video');

  if (!file) {
    return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
  }

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 });
  }

  const ext = path.extname(file.name) || '.mp4';
  const filename = `${crypto.randomUUID()}${ext}`;

  try {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    return NextResponse.json({ videoUrl: blob.url });
  } catch (err) {
    console.error('Blob upload failed:', err);
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
  }
}
