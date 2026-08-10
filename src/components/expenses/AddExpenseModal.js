'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function nowLocalDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AddExpenseModal({ open, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState({
    amount: '',
    categoryId: '',
    paymentMethodId: '',
    date: nowLocalDatetime(),
    description: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setForm((f) => ({ ...f, categoryId: f.categoryId || d.categories?.[0]?._id || '' }));
      });
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        setMethods(d.methods || []);
        setForm((f) => ({ ...f, paymentMethodId: f.paymentMethodId || d.methods?.[0]?._id || '' }));
      });
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          date: new Date(form.date).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save expense. Please try again.');

      setConfirmation(`Expense of ₹${Number(form.amount).toLocaleString('en-IN')} added successfully.`);
      onSaved?.(data.expense);
      setForm({
        amount: '',
        categoryId: form.categoryId,
        paymentMethodId: form.paymentMethodId,
        date: nowLocalDatetime(),
        description: '',
      });
      setTimeout(() => {
        setConfirmation('');
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/40 backdrop-blur-sm px-0 md:px-4">
      <div className="card w-full md:max-w-md rounded-b-none md:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Add expense</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-ink/50 hover:text-ink dark:text-paper/50">
            <X size={20} />
          </button>
        </div>

        {confirmation ? (
          <p className="text-sm text-teal bg-teal-50 dark:bg-teal-700/20 rounded-lg px-3 py-3 text-center font-medium">
            {confirmation}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <p className="text-sm text-coral bg-coral-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60 mb-1 block">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                inputMode="decimal"
                placeholder="0.00"
                className="input amount text-xl font-semibold"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60 mb-1 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c._id}
                    onClick={() => setForm({ ...form, categoryId: c._id })}
                    className={`stamp-chip ${
                      form.categoryId === c._id
                        ? 'border-teal bg-teal-50 text-teal-600 dark:bg-teal-700/20'
                        : 'border-mist text-ink/70 dark:border-mistdark dark:text-paper/70'
                    }`}
                  >
                    <span>{c.icon}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60 mb-1 block">
                  Date & time
                </label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60 mb-1 block">
                  Payment method
                </label>
                <select
                  className="input"
                  value={form.paymentMethodId}
                  onChange={(e) => setForm({ ...form, paymentMethodId: e.target.value })}
                >
                  {methods.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60 mb-1 block">
                Notes (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with friends"
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
              {saving ? 'Saving…' : 'Save expense'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
