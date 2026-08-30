import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';

// POST /api/upload — this endpoint no longer receives the video file
// itself. Large video files are uploaded directly from the browser to
// Vercel Blob storage (bypassing this serverless function entirely,
// since Vercel functions cap request bodies at a few MB — far too
// small for a movie file). This route's only job is to hand out a
// short-lived, admin-only upload token that authorizes the browser to
// talk to Blob storage directly. See app/admin/upload/page.js for the
// client side of this flow.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side action needed — the client saves the returned
        // blob URL to the movie's metadata via POST /api/movies.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Blob handleUpload error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
