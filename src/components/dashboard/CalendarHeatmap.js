'use client';
 
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
 
function heatLevel(amount, max) {
  if (!amount) return 0;
  const ratio = amount / (max || 1);
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}
 
export default function CalendarHeatmap({ initialMonth, initialByDay }) {
  const [cursor, setCursor] = useState(new Date(initialMonth));
  const [byDay, setByDay] = useState(initialByDay);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayExpenses, setDayExpenses] = useState([]);
 
  const dayMap = useMemo(() => {
    const m = new Map();
    byDay.forEach((d) => m.set(d.date, d.total));
    return m;
  }, [byDay]);
 
  const maxAmount = Math.max(1, ...byDay.map((d) => d.total));
 
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
 
  async function changeMonth(delta) {
    const next = new Date(year, month + delta, 1);
    setCursor(next);
    setLoading(true);
    // Send year/month as plain numbers, not an ISO string â€” an ISO string
    // gets converted to UTC in transit, which can shift the date across a
    // month boundary depending on the browser's timezone, and the server
    // would then read back the wrong month.
    const targetYear = next.getFullYear();
    const targetMonth = next.getMonth() + 1; // API expects 1-indexed month
    const res = await fetch(`/api/expenses/analytics?range=calendar&year=${targetYear}&month=${targetMonth}`);
    const data = await res.json();
    setByDay(data.byDay || []);
    setLoading(false);
    setSelectedDay(null);
  }
 
  async function openDay(dateStr) {
    setSelectedDay(dateStr);
    const res = await fetch(`/api/expenses?startDate=${dateStr}&endDate=${dateStr}T23:59:59`);
    const data = await res.json();
    setDayExpenses(data.expenses || []);
  }
 
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
 
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-mist/50 dark:hover:bg-mistdark">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-display font-semibold">
          {cursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-mist/50 dark:hover:bg-mistdark">
          <ChevronRight size={18} />
        </button>
      </div>
 
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-ink/40 dark:text-paper/40 mb-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
 
      <div className={`grid grid-cols-7 gap-1.5 ${loading ? 'opacity-50' : ''}`}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const amount = dayMap.get(dateStr) || 0;
          const level = heatLevel(amount, maxAmount);
          return (
            <button
              key={i}
              onClick={() => openDay(dateStr)}
              className={`aspect-square rounded-lg heat-${level} flex flex-col items-center justify-center text-xs transition ${
                selectedDay === dateStr ? 'ring-2 ring-teal' : ''
              }`}
            >
              <span className="font-medium">{d}</span>
              {amount > 0 && <span className="text-[9px] amount">â‚¹{amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount}</span>}
            </button>
          );
        })}
      </div>
 
      {selectedDay && (
        <div className="mt-5 border-t border-mist dark:border-mistdark pt-4">
          <h3 className="font-semibold text-sm mb-2">
            {new Date(selectedDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </h3>
          {dayExpenses.length === 0 ? (
            <p className="text-sm text-ink/50 dark:text-paper/50">No expenses on this day.</p>
          ) : (
            <ul className="space-y-2">
              {dayExpenses.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between text-sm">
                  <span>
                    {tx.categoryId?.icon} {tx.categoryId?.name}
                    {tx.description ? ` Â· ${tx.description}` : ''}
                  </span>
                  <span className="amount font-medium">â‚¹{tx.amount.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
