'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // '', 'uploading', 'saving', 'done', 'error'
  const [errorMsg, setErrorMsg] = useState('');

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!videoFile) {
      setErrorMsg('Please choose a video file.');
      return;
    }

    try {
      // 1. Upload the video file itself (multipart/form-data, tracked with XHR for progress)
      setStatus('uploading');
      const videoUrl = await uploadVideoWithProgress(videoFile, setProgress);

      // 2. Create the movie metadata entry, pointing at the stored Blob URL
      setStatus('saving');
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          year: form.year ? Number(form.year) : undefined,
          videoUrl,
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

        <Field label="Video file (mp4, webm, or ogg)">
          <input
            type="file"
            accept="video/*"
            required
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="input file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marquee file:text-void file:font-medium"
          />
        </Field>

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

// Uses XHR (not fetch) so we can report real upload progress for large video files.
function uploadVideoWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.videoUrl);
      } else {
        try {
          reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));

    xhr.send(formData);
  });
}
