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

// Uploads an IMAGE through our own server (not directly to Blob's CDN
// domain). Some connections can reach our app fine but fail to reach
// Blob storage's separate domain directly — this sidesteps that since
// images are small enough to fit comfortably within the serverless
// request size limit.
export async function uploadImageViaServer(file, { timeoutMs = 60 * 1000 } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Image upload failed.');
    }
    return await res.json(); // { url }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Upload timed out after ${Math.round(timeoutMs / 1000)}s — try a more stable connection.`);
    }
    throw err;
  }
}
