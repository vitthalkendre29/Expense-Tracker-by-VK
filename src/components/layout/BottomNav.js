'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, Calendar, User, Plus } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];
const NAV_RIGHT = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings', label: 'Profile', icon: User },
];

export default function BottomNav({ onAddClick }) {
  const pathname = usePathname();

  const Item = ({ href, label, icon: Icon }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[11px] font-medium ${
          active ? 'text-teal' : 'text-ink/50 dark:text-paper/50'
        }`}
      >
        <Icon size={20} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0D1613]/95 backdrop-blur border-t border-mist dark:border-mistdark pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center">
        {NAV.map((item) => (
          <Item key={item.href} {...item} />
        ))}

        <div className="flex-1 flex justify-center">
          <button
            onClick={onAddClick}
            aria-label="Add expense"
            className="w-14 h-14 -mt-6 rounded-full bg-teal shadow-lg flex items-center justify-center border-4 border-paper dark:border-paperdark active:scale-95 transition"
          >
            <Plus size={26} className="text-paper" />
          </button>
        </div>

        {NAV_RIGHT.map((item) => (
          <Item key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
