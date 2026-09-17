'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

// Computes a human label for the period `offset` units back from "now"
// offset: 0 = current period, -1 = previous period, etc.
function getPeriodLabel(range, offset) {
  const now = new Date();

  if (range === 'week') {
    const start = new Date(now);
    const day = start.getDay(); // 0 = Sunday
    start.setDate(start.getDate() - day + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
  }

  if (range === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  if (range === 'quarter') {
    const totalQuarters = Math.floor(now.getMonth() / 3) + offset;
    const year = now.getFullYear() + Math.floor(totalQuarters / 4);
    const q = ((totalQuarters % 4) + 4) % 4;
    return `Q${q + 1} ${year}`;
  }

  if (range === 'year') {
    return `${now.getFullYear() + offset}`;
  }

  return '';
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('month');
  const [offset, setOffset] = useState(0); // 0 = current period, negative = past
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reset to current period whenever the range type changes
  const handleRangeChange = (key) => {
    setRange(key);
    setOffset(0);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/expenses/analytics?range=${range}&offset=${offset}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [range, offset]);

  const isCurrentPeriod = offset === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">Analytics</h1>
        <div className="flex gap-1.5 bg-mist/40 dark:bg-mistdark p-1 rounded-xl">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                range === r.key ? 'bg-white dark:bg-[#152420] shadow-sm text-teal-600' : 'text-ink/60 dark:text-paper/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="p-2 rounded-lg hover:bg-mist/40 dark:hover:bg-mistdark transition"
          aria-label="Previous period"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          {getPeriodLabel(range, offset)}
          {isCurrentPeriod && (
            <span className="ml-1 text-xs text-ink/40 dark:text-paper/40">(current)</span>
          )}
        </span>
        <button
          onClick={() => setOffset((o) => (o < 0 ? o + 1 : o))}
          disabled={isCurrentPeriod}
          className={`p-2 rounded-lg transition ${
            isCurrentPeriod
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-mist/40 dark:hover:bg-mistdark'
          }`}
          aria-label="Next period"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
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
