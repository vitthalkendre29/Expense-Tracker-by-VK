import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function ProtectedLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return <DashboardShell>{children}</DashboardShell>;
}
