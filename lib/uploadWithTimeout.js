import { upload } from '@vercel/blob/client';

// Wraps @vercel/blob/client's upload() with a timeout so a stalled
// connection surfaces a clear error instead of hanging the UI forever
// with no feedback.
export async function uploadWithTimeout(filename, file, { onProgress, timeoutMs = 90 * 1000 } = {}) {
  const uploadPromise = upload(filename, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    ...(onProgress ? { onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)) } : {}),
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Upload timed out after ${Math.round(timeoutMs / 1000)}s — try a smaller file or a more stable connection.`
          )
        ),
      timeoutMs
    )
  );

  return Promise.race([uploadPromise, timeoutPromise]);
}
