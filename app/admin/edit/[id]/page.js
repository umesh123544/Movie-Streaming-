'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { upload } from '@vercel/blob/client';

export default function EditMoviePage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    year: '',
    posterUrl: '',
    videoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [videoFile, setVideoFile] = useState(null);
  const [videoMode, setVideoMode] = useState('keep'); // 'keep' | 'upload' | 'url'
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const [qualities, setQualities] = useState([]); // [{ label, url }]
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // '', 'uploading', 'saving', 'error'
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

  useEffect(() => {
    fetch(`/api/movies/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          genre: data.genre || '',
          year: data.year || '',
          posterUrl: data.posterUrl || '',
          videoUrl: data.videoUrl || '',
        });
        setSubtitleUrl(data.subtitleUrl || '');
        setQualities(data.qualities || []);
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg('Could not load this movie.');
        setLoading(false);
      });
  }, [id]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (videoMode === 'upload' && !videoFile) {
      setErrorMsg('Please choose a video file, or switch back to "Keep current video".');
      return;
    }
    if (videoMode === 'url' && !videoUrlInput.trim()) {
      setErrorMsg('Please paste a video URL, or switch back to "Keep current video".');
      return;
    }

    try {
      let finalVideoUrl = form.videoUrl; // default: unchanged

      if (videoMode === 'url') {
        finalVideoUrl = videoUrlInput.trim();
      } else if (videoMode === 'upload') {
        setStatus('uploading');
        const ext = videoFile.name.includes('.') ? videoFile.name.split('.').pop() : 'mp4';
        const randomName = `${crypto.randomUUID()}.${ext}`;

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

      setStatus('saving');
      const res = await fetch(`/api/movies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          genre: form.genre,
          year: form.year ? Number(form.year) : undefined,
          posterUrl: form.posterUrl,
          videoUrl: finalVideoUrl,
          subtitleUrl: subtitleUrl.trim() || undefined,
          qualities: qualities.filter((q) => q.label.trim() && q.url.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save changes.');
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl tracking-wide mb-8">EDIT MOVIE</h1>

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
            />
          </Field>
          <Field label="Year">
            <input
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Poster image URL">
          <input
            required
            value={form.posterUrl}
            onChange={(e) => updateField('posterUrl', e.target.value)}
            className="input"
          />
          {form.posterUrl && (
            <img
              src={form.posterUrl}
              alt="Poster preview"
              className="mt-2 h-32 w-auto rounded-md border border-white/10 object-cover"
            />
          )}
        </Field>

        <div>
          <span className="block text-sm text-muted mb-2">Video</span>
          <div className="flex flex-wrap gap-2 mb-3">
            <ModeButton active={videoMode === 'keep'} onClick={() => setVideoMode('keep')}>
              Keep current video
            </ModeButton>
            <ModeButton active={videoMode === 'upload'} onClick={() => setVideoMode('upload')}>
              Upload a new file
            </ModeButton>
            <ModeButton active={videoMode === 'url'} onClick={() => setVideoMode('url')}>
              Paste a new video URL
            </ModeButton>
          </div>

          {videoMode === 'upload' && (
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="input file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-marquee file:text-void file:font-medium"
            />
          )}
          {videoMode === 'url' && (
            <input
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="input"
              placeholder="https://…/movie.mp4"
            />
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
            <p className="text-xs text-muted">None added.</p>
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

        {status === 'uploading' && (
          <div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-marquee transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted mt-1">Uploading video… {progress}%</p>
          </div>
        )}
        {status === 'saving' && <p className="text-xs text-muted">Saving changes…</p>}
        {errorMsg && <p className="text-velvet text-sm">{errorMsg}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={status === 'uploading' || status === 'saving'}
            className="bg-marquee text-void font-display text-lg tracking-wide px-6 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50"
          >
            {status === 'uploading' || status === 'saving' ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="text-muted hover:text-bone px-4"
          >
            Cancel
          </button>
        </div>
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

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-md border ${
        active ? 'bg-marquee text-void border-marquee' : 'border-white/20 text-muted'
      }`}
    >
      {children}
    </button>
  );
}
