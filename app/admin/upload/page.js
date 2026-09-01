'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadWithTimeout } from '@/lib/uploadWithTimeout';

export default function UploadMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    year: '',
    posterUrl: '',
  });
  const [posterMode, setPosterMode] = useState('url'); // 'url' | 'upload'
  const [posterFile, setPosterFile] = useState(null);
  const [posterUploading, setPosterUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoMode, setVideoMode] = useState('url'); // 'upload' | 'url'
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [qualities, setQualities] = useState([]); // [{ label, url }]
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // '', 'uploading', 'saving', 'done', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  function addQualityRow() {
    setQualities((prev) => [...prev, { label: '', url: '' }]);
  }
  function updateQualityRow(index, field, value) {
    setQualities((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  }
  function removeQualityRow(index) {
    setQualities((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (posterMode === 'upload' && !posterFile && !form.posterUrl) {
      setErrorMsg('Please choose a poster photo, or switch to "Paste a URL".');
      return;
    }
    if (videoMode === 'upload' && !videoFile) {
      setErrorMsg('Please choose a video file.');
      return;
    }
    if (videoMode === 'url' && !videoUrlInput.trim()) {
      setErrorMsg('Please paste a video URL.');
      return;
    }

    try {
      let finalPosterUrl = form.posterUrl;

      if (posterMode === 'upload' && posterFile) {
        setPosterUploading(true);
        const ext = posterFile.name.includes('.') ? posterFile.name.split('.').pop() : 'jpg';
        const randomName = `poster-${crypto.randomUUID()}.${ext}`;
        const posterBlob = await uploadWithTimeout(randomName, posterFile, { timeoutMs: 90 * 1000 });
        finalPosterUrl = posterBlob.url;
        setPosterUploading(false);
      }

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

        const blob = await uploadWithTimeout(randomName, videoFile, {
          onProgress: setProgress,
          timeoutMs: 3 * 60 * 1000,
        });
        finalVideoUrl = blob.url;
      }

      // Create the movie metadata entry, pointing at the video URL
      setStatus('saving');
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          posterUrl: finalPosterUrl,
          year: form.year ? Number(form.year) : undefined,
          videoUrl: finalVideoUrl,
          subtitleUrl: subtitleUrl.trim() || undefined,
          qualities: qualities.filter((q) => q.label.trim() && q.url.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save movie details.');
      }

      setStatus('done');
      router.push('/admin/dashboard');
    } catch (err) {
      setPosterUploading(false);
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

        <div>
          <span className="block text-sm text-muted mb-2">Poster image</span>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setPosterMode('url')}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                posterMode === 'url' ? 'bg-marquee text-void border-marquee' : 'border-white/20 text-muted'
              }`}
            >
              Paste a URL
            </button>
            <button
              type="button"
              onClick={() => setPosterMode('upload')}
              className={`text-sm px-3 py-1.5 rounded-md border ${
                posterMode === 'upload' ? 'bg-marquee text-void border-marquee' : 'border-white/20 text-muted'
              }`}
            >
              Upload a photo
            </button>
          </div>

          {posterMode === 'url' ? (
            <input
              value={form.posterUrl}
              onChange={(e) => updateField('posterUrl', e.target.value)}
              className="input"
              placeholder="https://…"
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
              className="input file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marquee file:text-void file:font-medium"
            />
          )}

          {posterMode === 'upload' && posterFile && (
            <img
              src={URL.createObjectURL(posterFile)}
              alt="Poster preview"
              className="mt-2 h-32 w-auto rounded-md border border-white/10 object-cover"
            />
          )}
          {posterMode === 'url' && form.posterUrl && (
            <img
              src={form.posterUrl}
              alt="Poster preview"
              className="mt-2 h-32 w-auto rounded-md border border-white/10 object-cover"
            />
          )}
        </div>

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

        <Field label="Subtitle file URL (optional, .vtt)">
          <input
            value={subtitleUrl}
            onChange={(e) => setSubtitleUrl(e.target.value)}
            className="input"
            placeholder="https://…/subtitles.vtt"
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Alternate qualities (optional)</span>
            <button
              type="button"
              onClick={addQualityRow}
              className="text-xs text-marquee hover:underline"
            >
              + Add quality
            </button>
          </div>
          {qualities.length === 0 ? (
            <p className="text-xs text-muted">
              None added — the player will just use the video above. Add rows to offer a quality picker (e.g. "480p", "720p").
            </p>
          ) : (
            <div className="space-y-2">
              {qualities.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={q.label}
                    onChange={(e) => updateQualityRow(i, 'label', e.target.value)}
                    placeholder="Label (e.g. 480p)"
                    className="input w-28 flex-shrink-0"
                  />
                  <input
                    value={q.url}
                    onChange={(e) => updateQualityRow(i, 'url', e.target.value)}
                    placeholder="https://…/movie-480p.mp4"
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeQualityRow(i)}
                    className="text-velvet text-sm px-2 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {posterUploading && <p className="text-xs text-muted">Uploading poster…</p>}
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
          disabled={status === 'uploading' || status === 'saving' || posterUploading}
          className="bg-marquee text-void font-display text-lg tracking-wide px-6 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50"
        >
          {status === 'uploading' || status === 'saving' || posterUploading ? 'PUBLISHING…' : 'PUBLISH MOVIE'}
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
