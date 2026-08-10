'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SpendingTrendChart({ data }) {
  // data: [{ date: '2026-08-01', total: 500 }, ...]
  if (!data?.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-ink/40 dark:text-paper/40">
        Not enough data yet. Add a few expenses to see your spending trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6B5B" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#1B6B5B" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#DCE6DE" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          tick={{ fontSize: 11, fill: '#10241E99' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: '#10241E99' }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
          contentStyle={{ borderRadius: 12, border: '1px solid #DCE6DE', fontSize: 13 }}
        />
        <Area type="monotone" dataKey="total" stroke="#1B6B5B" strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
