'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Unable to create account.');
      setLoading(false);
      return;
    }

    const signInRes = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signInRes?.error) {
      router.push('/login');
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
          <h1 className="font-display font-bold text-lg mb-1">Create your account</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60 mb-6">
            Start tracking your spending in under a minute.
          </p>

          {error && (
            <p className="text-sm text-coral bg-coral-100 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Full name"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
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
              minLength={8}
              placeholder="Password (min. 8 characters)"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-ink/60 dark:text-paper/60">
            Already have an account?{' '}
            <Link href="/login" className="text-teal font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
