import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import path from 'path';

export const runtime = 'nodejs';

// POST /api/upload-image — signed-in admin OR viewer, image files only
// (poster photos, avatars). Unlike video uploads, this goes through our
// own server rather than directly from the browser to Blob storage —
// images are small enough to fit Vercel's serverless request body limit
// comfortably, and routing through our own domain avoids relying on the
// visitor's network being able to reach Blob storage's separate CDN
// domain directly (which has proven unreliable on some connections,
// even when the rest of the site loads fine).
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'user')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Please upload an image file' }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image is too large (max 8MB)' }, { status: 400 });
  }

  const ext = path.extname(file.name) || '.jpg';
  const filename = `img-${crypto.randomUUID()}${ext}`;

  try {
    const blob = await put(filename, file, { access: 'public' });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('Image upload failed:', err);
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
  }
}
