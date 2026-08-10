'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password.');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center">
            <Wallet size={18} className="text-paper" />
          </div>
          <span className="font-display font-bold text-xl">Ledger</span>
        </div>

        <div className="card p-6">
          <h1 className="font-display font-bold text-lg mb-1">Welcome back</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
            Sign in to keep tracking your spending.
          </p>

          {error && (
            <p className="text-sm text-coral bg-coral-100 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="password"
              required
              placeholder="Password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-secondary w-full mt-3"
          >
            Continue with Google
          </button>

          <p className="text-sm text-center mt-6 text-ink/60 dark:text-paper/60">
            No account?{' '}
            <Link href="/register" className="text-teal font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
