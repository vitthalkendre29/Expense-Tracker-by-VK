'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function CategoryDonut({ data }) {
  // data: [{ name, total, color, icon }]
  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-ink/40 dark:text-paper/40">
        No expenses yet this period.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="100%" height={180} className="max-w-[180px]">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2 min-w-0">
        {data.slice(0, 5).map((c) => (
          <div key={c.name} className="flex items-center justify-between text-sm gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="truncate">
                {c.icon} {c.name}
              </span>
            </span>
            <span className="amount font-medium shrink-0">₹{c.total.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
