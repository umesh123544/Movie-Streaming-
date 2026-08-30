'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';

export default function UploadMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    year: '',
    posterUrl: '',
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoMode, setVideoMode] = useState('upload'); // 'upload' | 'url'
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // '', 'uploading', 'saving', 'done', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (videoMode === 'upload' && !videoFile) {
      setErrorMsg('Please choose a video file.');
      return;
    }
    if (videoMode === 'url' && !videoUrlInput.trim()) {
      setErrorMsg('Please paste a video URL.');
      return;
    }

    try {
      let finalVideoUrl;

      if (videoMode === 'url') {
        // Video is already hosted elsewhere (Google Drive direct link,
        // another CDN, etc.) — skip our own upload flow entirely and
        // just point the player at it. /api/stream still proxies through
        // this URL server-side, so it's never exposed to visitors directly.
        finalVideoUrl = videoUrlInput.trim();
      } else {
        // Upload the video file directly from the browser to Vercel Blob
        // storage (not through our own API — serverless functions cap
        // request bodies far below typical movie file sizes). Use a random
        // filename rather than the original one, so nothing about the
        // uploader's local file is exposed.
        setStatus('uploading');
        const ext = videoFile.name.includes('.') ? videoFile.name.split('.').pop() : 'mp4';
        const randomName = `${crypto.randomUUID()}.${ext}`;

        // Race the upload against a soft timeout — if it stalls (flaky
        // connection, dropped request) we surface an error instead of
        // leaving the progress bar frozen forever with no feedback.
        const uploadPromise = upload(randomName, videoFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Upload timed out after 3 minutes — try a smaller file or a more stable connection.')),
            3 * 60 * 1000
          )
        );
        const blob = await Promise.race([uploadPromise, timeoutPromise]);
        finalVideoUrl = blob.url;
      }

      // Create the movie metadata entry, pointing at the video URL
      setStatus('saving');
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : undefined,
          videoUrl: finalVideoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save movie details.');
      }

      setStatus('done');
      router.push('/admin/dashboard');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl tracking-wide mb-8">UPLOAD MOVIE</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Genre">
            <input
              required
              value={form.genre}
              onChange={(e) => updateField('genre', e.target.value)}
              className="input"
              placeholder="Drama, Action, …"
            />
          </Field>
          <Field label="Year">
            <input
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', e.target.value)}
              className="input"
              placeholder="2026"
            />
          </Field>
        </div>

        <Field label="Poster image URL">
          <input
            required
            value={form.posterUrl}
            onChange={(e) => updateField('posterUrl', e.target.value)}
            className="input"
            placeholder="https://…"
          />
        </Field>

        <div>
          <span className="block text-sm text-muted mb-2">Video source</span>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setVideoMode('upload')}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                videoMode === 'upload'
                  ? 'bg-marquee text-void border-marquee'
                  : 'border-white/20 text-muted'
              }`}
            >
              Upload a file
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('url')}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                videoMode === 'url'
                  ? 'bg-marquee text-void border-marquee'
                  : 'border-white/20 text-muted'
              }`}
            >
              Paste a video URL
            </button>
          </div>

          {videoMode === 'upload' ? (
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="input file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marquee file:text-void file:font-medium"
            />
          ) : (
            <div>
              <input
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="input"
                placeholder="https://…/movie.mp4"
              />
              <p className="text-xs text-muted mt-1">
                A direct link to an already-hosted video file (mp4/webm/ogg) — skips uploading here entirely.
              </p>
            </div>
          )}
        </div>

        {status === 'uploading' && (
          <div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-marquee transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-1">Uploading video… {progress}%</p>
          </div>
        )}
        {status === 'saving' && <p className="text-xs text-muted">Saving movie details…</p>}
        {errorMsg && <p className="text-velvet text-sm">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'uploading' || status === 'saving'}
          className="bg-marquee text-void font-display text-lg tracking-wide px-6 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50"
        >
          {status === 'uploading' || status === 'saving' ? 'PUBLISHING…' : 'PUBLISH MOVIE'}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          background: #16161a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px 12px;
          color: #f2efe9;
        }
        .input:focus {
          outline: none;
          border-color: #e8a33d;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
