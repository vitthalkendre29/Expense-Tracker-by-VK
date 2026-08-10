import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPeriodSummary, getRecentExpenses } from '@/lib/analytics';
import SpendingTrendChart from '@/components/dashboard/SpendingTrendChart';
import CategoryDonut from '@/components/dashboard/CategoryDonut';
import { TrendingUp, TrendingDown } from 'lucide-react';

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const prevMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59, 999);

  const [today, month, prevMonth, recent] = await Promise.all([
    getPeriodSummary(userId, todayStart, todayEnd),
    getPeriodSummary(userId, monthStart, monthEnd),
    getPeriodSummary(userId, prevMonthStart, prevMonthEnd),
    getRecentExpenses(userId, 8),
  ]);

  const change = prevMonth.total > 0 ? ((month.total - prevMonth.total) / prevMonth.total) * 100 : null;
  const dailyAverage = month.byDay.length ? month.total / month.byDay.length : 0;
  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-ink/50 dark:text-paper/50">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display font-bold text-2xl">Good to see you, {session.user.name?.split(' ')[0]} 👋</h1>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Today's spending</p>
          <p className="amount text-2xl font-semibold">{fmt(today.total)}</p>
          <p className="text-xs text-ink/40 dark:text-paper/40 mt-1">{today.count} transactions</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">{monthName} spending</p>
          <p className="amount text-2xl font-semibold">{fmt(month.total)}</p>
          {change !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${change >= 0 ? 'text-coral' : 'text-teal'}`}>
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(change).toFixed(1)}% vs last month
            </p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Daily average</p>
          <p className="amount text-2xl font-semibold">{fmt(dailyAverage)}</p>
          <p className="text-xs text-ink/40 dark:text-paper/40 mt-1">this month</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink/50 dark:text-paper/50 mb-1">Top category</p>
          <p className="text-lg font-semibold font-display truncate">
            {month.byCategory[0] ? `${month.byCategory[0].icon} ${month.byCategory[0].name}` : '—'}
          </p>
          <p className="text-xs text-ink/40 dark:text-paper/40 mt-1">
            {month.byCategory[0] ? fmt(month.byCategory[0].total) : 'No data yet'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-display font-semibold mb-2">Spending this month</h2>
          <SpendingTrendChart data={month.byDay} />
        </div>

        <div className="card p-5">
          <h2 className="font-display font-semibold mb-3">By category</h2>
          <CategoryDonut data={month.byCategory} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Recent transactions</h2>
        {recent.length === 0 ? (
          <div className="text-center py-10">
            <p className="font-medium mb-1">No expenses yet</p>
            <p className="text-sm text-ink/50 dark:text-paper/50">
              Start tracking your spending by adding your first expense.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-mist dark:divide-mistdark">
            {recent.map((tx) => (
              <li key={tx._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ background: `${tx.categoryId?.color}22` }}
                  >
                    {tx.categoryId?.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{tx.categoryId?.name}</p>
                    <p className="text-xs text-ink/50 dark:text-paper/50 truncate">
                      {new Date(tx.date).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {tx.description ? ` · ${tx.description}` : ''}
                    </p>
                  </div>
                </div>
                <p className="amount font-semibold shrink-0">{fmt(tx.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
