'use client';

import { useEffect, useState } from 'react';
import SpendingTrendChart from '@/components/dashboard/SpendingTrendChart';
import CategoryDonut from '@/components/dashboard/CategoryDonut';

const RANGES = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
];

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/expenses/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">Analytics</h1>
        <div className="flex gap-1.5 bg-mist/40 dark:bg-mistdark p-1 rounded-xl">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                range === r.key ? 'bg-white dark:bg-[#152420] shadow-sm text-teal-600' : 'text-ink/60 dark:text-paper/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div className="card p-10 text-center text-sm text-ink/40 dark:text-paper/40">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="card p-4">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Total spent</p>
              <p className="amount text-xl font-semibold">{fmt(data.summary.total)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Transactions</p>
              <p className="amount text-xl font-semibold">{data.summary.count}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Daily average</p>
              <p className="amount text-xl font-semibold">{fmt(data.summary.dailyAverage)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">vs. previous period</p>
              <p
                className={`amount text-xl font-semibold ${
                  data.summary.percentChange >= 0 ? 'text-coral' : 'text-teal'
                }`}
              >
                {data.summary.percentChange === null ? '—' : `${data.summary.percentChange > 0 ? '+' : ''}${data.summary.percentChange}%`}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold mb-2">Spending trend</h2>
              <SpendingTrendChart data={data.byDay} />
            </div>
            <div className="card p-5">
              <h2 className="font-display font-semibold mb-3">By category</h2>
              <CategoryDonut data={data.byCategory} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display font-semibold mb-3">By payment method</h2>
            {data.byPaymentMethod.length === 0 ? (
              <p className="text-sm text-ink/50 dark:text-paper/50">No data for this period.</p>
            ) : (
              <div className="space-y-2">
                {data.byPaymentMethod.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span>{m.name}</span>
                    <span className="amount font-medium">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
