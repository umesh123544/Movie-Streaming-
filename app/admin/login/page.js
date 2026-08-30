'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MarqueeStrip from '@/components/MarqueeStrip';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('admin', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }
    router.push('/admin/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <MarqueeStrip count={12} />
        <h1 className="font-display text-4xl tracking-wide mt-2 mb-6">ADMIN SIGN IN</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-md px-3 py-2 text-bone focus:border-marquee outline-none"
            />
          </div>

          {error && <p className="text-velvet text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marquee text-void font-display text-lg tracking-wide py-2 rounded-md hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'SIGNING IN…' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </main>
  );
}
