'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/budgets')
      .then((r) => r.json())
      .then((d) => setBudgets(d.budgets || []));
  }, []);

  async function addOverallBudget(e) {
    e.preventDefault();
    if (!newBudget) return;
    setSaving(true);
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(newBudget), categoryId: null }),
    });
    if (res.ok) {
      const { budget } = await res.json();
      setBudgets((b) => [...b, { ...budget, spent: 0, remaining: budget.amount, percent: 0, status: 'ok' }]);
      setNewBudget('');
    }
    setSaving(false);
  }

  const statusColor = { ok: 'bg-teal', warning: 'bg-amber', critical: 'bg-coral', exceeded: 'bg-coral' };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl">Settings</h1>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Profile</h2>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-ink/50 dark:text-paper/50">Name:</span> {session?.user?.name}
          </p>
          <p>
            <span className="text-ink/50 dark:text-paper/50">Email:</span> {session?.user?.email}
          </p>
          <p>
            <span className="text-ink/50 dark:text-paper/50">Currency:</span> INR (₹)
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Monthly budget</h2>

        {budgets.length > 0 && (
          <div className="space-y-4 mb-4">
            {budgets.map((b) => (
              <div key={b._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.categoryId ? `${b.categoryId.icon} ${b.categoryId.name}` : 'Overall budget'}</span>
                  <span className="amount">
                    ₹{b.spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-mist/50 dark:bg-mistdark overflow-hidden">
                  <div
                    className={`h-full ${statusColor[b.status]}`}
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
                {b.status !== 'ok' && (
                  <p className="text-xs text-coral mt-1">
                    {b.status === 'exceeded' ? "You've exceeded this budget." : `${b.percent}% of budget used.`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addOverallBudget} className="flex gap-2">
          <input
            type="number"
            placeholder="Set monthly budget (₹)"
            className="input"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            Save
          </button>
        </form>
      </div>

      <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary">
        Sign out
      </button>
    </div>
  );
}
