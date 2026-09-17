'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';

const ICON_CHOICES = ['📦', '🍔', '🏠', '🚗', '🛍️', '💡', '🎬', '🏥', '📚', '✈️', '💼', '🎁', '⛽', '🐾', '💊'];
const COLOR_CHOICES = ['#1B6B5B', '#E0A339', '#D9634A', '#5B7BD9', '#C15FBF', '#7A5FC1', '#2E8C77', '#3F9BD9', '#4A5B7A', '#8A8A8A'];

function ManageListCard({ title, items, onAdd, onUpdate, onDelete, itemKind }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(ICON_CHOICES[0]);
  const [newColor, setNewColor] = useState(COLOR_CHOICES[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isCategory = itemKind === 'category';

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError('');
    const payload = isCategory
      ? { name: newName.trim(), icon: newIcon, color: newColor }
      : { name: newName.trim() };
    const res = await onAdd(payload);
    if (res?.error) {
      setError(res.error);
    } else {
      setNewName('');
      setNewIcon(ICON_CHOICES[0]);
      setNewColor(COLOR_CHOICES[0]);
      setAdding(false);
    }
    setBusy(false);
  }

  function startEdit(item) {
    setEditingId(item._id);
    setEditName(item.name);
    setEditIcon(item.icon || ICON_CHOICES[0]);
    setEditColor(item.color || COLOR_CHOICES[0]);
    setError('');
  }

  async function handleUpdate(id) {
    if (!editName.trim()) return;
    setBusy(true);
    setError('');
    const payload = isCategory
      ? { name: editName.trim(), icon: editIcon, color: editColor }
      : { name: editName.trim() };
    const res = await onUpdate(id, payload);
    if (res?.error) {
      setError(res.error);
    } else {
      setEditingId(null);
    }
    setBusy(false);
  }

  async function handleDelete(id) {
    setError('');
    const res = await onDelete(id);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold">{title}</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm flex items-center gap-1 text-teal-600 font-medium"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-coral mb-3 bg-coral/10 px-2 py-1.5 rounded-lg">{error}</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-mist/30 dark:bg-mistdark">
          <input
            autoFocus
            className="input"
            placeholder={isCategory ? 'Category name' : 'Payment method name'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {isCategory && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {ICON_CHOICES.map((ic) => (
                  <button
                    type="button"
                    key={ic}
                    onClick={() => setNewIcon(ic)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg ${
                      newIcon === ic ? 'ring-2 ring-teal-600' : 'bg-mist/50 dark:bg-[#152420]'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_CHOICES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full ${newColor === c ? 'ring-2 ring-offset-2 ring-ink dark:ring-paper' : ''}`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={busy} className="btn-primary text-sm py-1.5">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setError('');
              }}
              className="btn-secondary text-sm py-1.5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between py-1.5 px-1 rounded-lg group">
            {editingId === item._id ? (
              <div className="flex flex-col gap-2 w-full p-2 rounded-lg bg-mist/30 dark:bg-mistdark">
                <input
                  autoFocus
                  className="input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                {isCategory && (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_CHOICES.map((ic) => (
                        <button
                          type="button"
                          key={ic}
                          onClick={() => setEditIcon(ic)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-base ${
                            editIcon === ic ? 'ring-2 ring-teal-600' : 'bg-mist/50 dark:bg-[#152420]'
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_CHOICES.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setEditColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-5 h-5 rounded-full ${editColor === c ? 'ring-2 ring-offset-2 ring-ink dark:ring-paper' : ''}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(item._id)}
                    disabled={busy}
                    className="p-1.5 rounded-lg bg-teal-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setError('');
                    }}
                    className="p-1.5 rounded-lg bg-mist/50 dark:bg-[#152420]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-sm flex items-center gap-2">
                  {isCategory && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {isCategory && item.icon} {item.name}
                  {item.isDefault && (
                    <span className="text-[10px] text-ink/40 dark:text-paper/40 uppercase tracking-wide">
                      default
                    </span>
                  )}
                </span>
                <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded-lg hover:bg-mist/40 dark:hover:bg-mistdark"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 rounded-lg hover:bg-coral/10 text-coral"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-paper/40">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    fetch('/api/budgets')
      .then((r) => r.json())
      .then((d) => setBudgets(d.budgets || []));

    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));

    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((d) => setMethods(d.methods || []));
  }, []);

  async function addOverallBudget(e) {
    e.preventDefault();
    if (!newBudget) return;
    setSaving(true);
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(newBudget), categoryId: null }),
    });
    if (res.ok) {
      const { budget } = await res.json();
      setBudgets((b) => [...b, { ...budget, spent: 0, remaining: budget.amount, percent: 0, status: 'ok' }]);
      setNewBudget('');
    }
    setSaving(false);
  }

  // --- Categories ---
  async function addCategory(payload) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to add category.' };
    setCategories((c) => [...c, d.category].sort((a, b) => a.name.localeCompare(b.name)));
    return {};
  }

  async function updateCategory(id, payload) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to update category.' };
    setCategories((c) => c.map((cat) => (cat._id === id ? d.category : cat)));
    return {};
  }

  async function deleteCategory(id) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to delete category.' };
    setCategories((c) => c.filter((cat) => cat._id !== id));
    return {};
  }

  // --- Payment methods ---
  async function addMethod(payload) {
    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to add payment method.' };
    setMethods((m) => [...m, d.method].sort((a, b) => a.name.localeCompare(b.name)));
    return {};
  }

  async function updateMethod(id, payload) {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to update payment method.' };
    setMethods((m) => m.map((meth) => (meth._id === id ? d.method : meth)));
    return {};
  }

  async function deleteMethod(id) {
    const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
    const d = await res.json();
    if (!res.ok) return { error: d.error || 'Unable to delete payment method.' };
    setMethods((m) => m.filter((meth) => meth._id !== id));
    return {};
  }

  const statusColor = { ok: 'bg-teal', warning: 'bg-amber', critical: 'bg-coral', exceeded: 'bg-coral' };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display font-bold text-2xl">Settings</h1>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Profile</h2>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-ink/50 dark:text-paper/50">Name:</span> {session?.user?.name}
          </p>
          <p>
            <span className="text-ink/50 dark:text-paper/50">Email:</span> {session?.user?.email}
          </p>
          <p>
            <span className="text-ink/50 dark:text-paper/50">Currency:</span> INR (₹)
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold mb-3">Monthly budget</h2>

        {budgets.length > 0 && (
          <div className="space-y-4 mb-4">
            {budgets.map((b) => (
              <div key={b._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.categoryId ? `${b.categoryId.icon} ${b.categoryId.name}` : 'Overall budget'}</span>
                  <span className="amount">
                    ₹{b.spent.toLocaleString('en-IN')} / ₹{b.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-mist/50 dark:bg-mistdark overflow-hidden">
                  <div
                    className={`h-full ${statusColor[b.status]}`}
                    style={{ width: `${Math.min(100, b.percent)}%` }}
                  />
                </div>
                {b.status !== 'ok' && (
                  <p className="text-xs text-coral mt-1">
                    {b.status === 'exceeded' ? "You've exceeded this budget." : `${b.percent}% of budget used.`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addOverallBudget} className="flex gap-2">
          <input
            type="number"
            placeholder="Set monthly budget (₹)"
            className="input"
            value={newBudget}
            onChange={(e) => setNewBudget(e.target.value)}
          />
          <button type="submit" disabled={saving} className="btn-primary shrink-0">
            Save
          </button>
        </form>
      </div>

      <ManageListCard
        title="Categories"
        items={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        itemKind="category"
      />

      <ManageListCard
        title="Payment methods"
        items={methods}
        onAdd={addMethod}
        onUpdate={updateMethod}
        onDelete={deleteMethod}
        itemKind="method"
      />

      <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary">
        Sign out
      </button>
    </div>
  );
}