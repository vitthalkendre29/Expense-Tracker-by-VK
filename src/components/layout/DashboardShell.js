'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';

export default function DashboardShell({ children }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-10">{children}</main>
      </div>

      {/* Desktop quick-add FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="hidden md:flex items-center gap-2 btn-primary fixed bottom-8 right-8 shadow-lg"
      >
        <Plus size={18} /> Add expense
      </button>

      <BottomNav onAddClick={() => setModalOpen(true)} />

      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
