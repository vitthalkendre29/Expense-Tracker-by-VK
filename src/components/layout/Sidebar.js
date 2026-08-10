'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-mist dark:border-mistdark h-screen sticky top-0 px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
          <Wallet size={16} className="text-paper" />
        </div>
        <span className="font-display font-bold text-lg">Ledger</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-teal-50 text-teal-600 dark:bg-teal-700/20 dark:text-teal-100'
                  : 'text-ink/70 hover:bg-mist/50 dark:text-paper/70 dark:hover:bg-mistdark'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-mist dark:border-mistdark pt-4 px-2">
        <p className="text-sm font-medium truncate">{session?.user?.name}</p>
        <p className="text-xs text-ink/50 dark:text-paper/50 truncate mb-3">
          {session?.user?.email}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-coral hover:underline"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
