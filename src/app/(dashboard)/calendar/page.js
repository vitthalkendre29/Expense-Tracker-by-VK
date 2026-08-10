import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPeriodSummary } from '@/lib/analytics';
import CalendarHeatmap from '@/components/dashboard/CalendarHeatmap';

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const month = await getPeriodSummary(session.user.id, monthStart, monthEnd);

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">Calendar</h1>
      <CalendarHeatmap initialMonth={monthStart.toISOString()} initialByDay={month.byDay} />
    </div>
  );
}
