'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ expenses: [], pagination: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    fetch(`/api/expenses?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [page, search]);

  async function handleDelete(id) {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e._id !== id) }));
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display font-bold text-2xl">Expenses</h1>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="text"
          placeholder="Search by description…"
          className="input pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="card divide-y divide-mist dark:divide-mistdark">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink/40 dark:text-paper/40">Loading…</p>
        ) : data.expenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-medium mb-1">No expenses found</p>
            <p className="text-sm text-ink/50 dark:text-paper/50">Try a different search or add a new expense.</p>
          </div>
        ) : (
          data.expenses.map((tx) => (
            <div key={tx._id} className="flex items-center justify-between px-4 py-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: `${tx.categoryId?.color}22` }}
                >
                  {tx.categoryId?.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {tx.categoryId?.name}
                    {tx.description ? ` — ${tx.description}` : ''}
                  </p>
                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {new Date(tx.date).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    · {tx.paymentMethodId?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="amount font-semibold">{fmt(tx.amount)}</p>
                <button
                  onClick={() => handleDelete(tx._id)}
                  className="text-ink/30 hover:text-coral transition opacity-0 group-hover:opacity-100"
                  aria-label="Delete expense"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page ? 'bg-teal text-paper' : 'bg-mist/40 dark:bg-mistdark'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
