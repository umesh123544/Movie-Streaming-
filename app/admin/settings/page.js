'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminSettingsPage() {
  const { update } = useSession();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((res) => res.json())
      .then((data) => {
        setName(data.name || 'Admin');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);

    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to save.');
      return;
    }

    setSaved(true);
    await update(); // refresh the session so the new name shows immediately
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-4xl tracking-wide mb-8">SETTINGS</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm text-muted mb-1">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
          />
        </label>

        {error && <p className="text-velvet text-sm">{error}</p>}
        {saved && <p className="text-marquee text-sm">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-marquee text-void font-display text-lg tracking-wide px-6 py-2.5 rounded-md hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'SAVING…' : 'SAVE'}
        </button>
      </form>
    </div>
  );
}
