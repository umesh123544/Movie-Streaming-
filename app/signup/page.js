'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MarqueeStrip from '@/components/MarqueeStrip';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    // Auto sign-in right after account creation.
    const signInRes = await signIn('user', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      // Account was created but auto sign-in failed — send them to /login instead.
      router.push('/login');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <MarqueeStrip count={12} />
          <h1 className="font-display text-4xl tracking-wide mt-2 mb-6">CREATE ACCOUNT</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
              />
              <p className="text-xs text-muted mt-1">At least 6 characters.</p>
            </div>

            {error && <p className="text-velvet text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-marquee text-void font-display text-lg tracking-wide py-2 rounded-md hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="text-sm text-muted mt-5 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-marquee hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
