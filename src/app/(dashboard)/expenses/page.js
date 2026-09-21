'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function getDateRange(period) {
  const now = new Date();

  // Today
  if (period === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Yesterday
  if (period === 'yesterday') {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // This week - Monday to Sunday
  if (period === 'thisWeek') {
    const start = new Date(now);
    const day = start.getDay();

    const diff = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // This month
  if (period === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // Last month
  if (period === 'lastMonth') {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    start.setHours(0, 0, 0, 0);

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      0
    );
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // This quarter
  if (period === 'thisQuarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

    const start = new Date(
      now.getFullYear(),
      quarterStartMonth,
      1
    );
    start.setHours(0, 0, 0, 0);

    const end = new Date(
      now.getFullYear(),
      quarterStartMonth + 3,
      0
    );
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // This year
  if (period === 'thisYear') {
    const start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  return null;
}

function formatDateForApi(date) {
  return date.toISOString();
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState('all');
  const [sort, setSort] = useState('-date');

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [showFilters, setShowFilters] = useState(false);

  const [data, setData] = useState({
    expenses: [],
    pagination: {},
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  /*
   * Load categories
   *
   * This expects your existing category API to be:
   * GET /api/categories
   */
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');

        if (!res.ok) {
          throw new Error('Unable to load categories');
        }

        const result = await res.json();

        // Supports either:
        // { categories: [...] }
        // or directly [...]
        const list = Array.isArray(result)
          ? result
          : result.categories || [];

        setCategories(list);
      } catch (error) {
        console.error('Category loading error:', error);
      } finally {
        setCategoryLoading(false);
      }
    }

    loadCategories();
  }, []);

  /*
   * Build API request whenever filters change
   */
  useEffect(() => {
    async function loadExpenses() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          sort,
        });

        if (search.trim()) {
          params.set('search', search.trim());
        }

        if (categoryId) {
          params.set('categoryId', categoryId);
        }

        /*
         * Quick date periods
         */
        if (period !== 'all' && period !== 'custom') {
          const range = getDateRange(period);

          if (range) {
            params.set(
              'startDate',
              formatDateForApi(range.start)
            );

            params.set(
              'endDate',
              formatDateForApi(range.end)
            );
          }
        }

        /*
         * Custom date range
         */
        if (period === 'custom') {
          if (customStart) {
            const start = new Date(`${customStart}T00:00:00`);

            params.set(
              'startDate',
              formatDateForApi(start)
            );
          }

          if (customEnd) {
            const end = new Date(`${customEnd}T23:59:59.999`);

            params.set(
              'endDate',
              formatDateForApi(end)
            );
          }
        }

        const res = await fetch(`/api/expenses?${params}`);

        if (!res.ok) {
          throw new Error('Unable to load expenses');
        }

        const result = await res.json();

        setData(result);
      } catch (error) {
        console.error('Expense loading error:', error);

        setData({
          expenses: [],
          pagination: {},
        });
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, [
    page,
    search,
    categoryId,
    period,
    customStart,
    customEnd,
    sort,
  ]);

  /*
   * Reset pagination when filters change
   */
  function updateFilter(callback) {
    setPage(1);
    callback();
  }

  function clearFilters() {
    setSearch('');
    setCategoryId('');
    setPeriod('all');
    setCustomStart('');
    setCustomEnd('');
    setSort('-date');
    setPage(1);
  }

  const hasActiveFilters =
    search ||
    categoryId ||
    period !== 'all' ||
    customStart ||
    customEnd ||
    sort !== '-date';

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (search) count++;
    if (categoryId) count++;
    if (period !== 'all') count++;
    if (sort !== '-date') count++;

    return count;
  }, [search, categoryId, period, sort]);

  const isToday = (date) => {
    const txDate = new Date(date);
    const today = new Date();

    return (
      txDate.getDate() === today.getDate() &&
      txDate.getMonth() === today.getMonth() &&
      txDate.getFullYear() === today.getFullYear()
    );
  };

  async function handleDelete(id) {
    if (
      !confirm(
        'Delete this expense? This cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/expenses/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        setData((d) => ({
          ...d,
          expenses: d.expenses.filter(
            (e) => e._id !== id
          ),
        }));
      }
    } catch (error) {
      console.error('Delete expense error:', error);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">
            Expenses
          </h1>

          {!loading &&
            data.pagination?.total !== undefined && (
              <p className="text-xs text-ink/50 dark:text-paper/50 mt-1">
                {data.pagination.total} expense
                {data.pagination.total !== 1 ? 's' : ''}
                found
              </p>
            )}
        </div>

        <button
          type="button"
          onClick={() =>
            setShowFilters((value) => !value)
          }
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-mist/40 dark:bg-mistdark text-sm"
        >
          <SlidersHorizontal size={16} />

          <span className="hidden sm:inline">
            Filters
          </span>

          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-teal text-paper text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}

          <ChevronDown
            size={15}
            className={`transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
        />

        <input
          type="text"
          placeholder="Search by description…"
          className="input pl-9 pr-10"
          value={search}
          onChange={(e) => {
            updateFilter(() =>
              setSearch(e.target.value)
            );
          }}
        />

        {search && (
          <button
            type="button"
            onClick={() =>
              updateFilter(() => setSearch(''))
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Category
              </label>

              <select
                className="input w-full"
                value={categoryId}
                onChange={(e) =>
                  updateFilter(() =>
                    setCategoryId(e.target.value)
                  )
                }
                disabled={categoryLoading}
              >
                <option value="">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                  >
                    {category.icon
                      ? `${category.icon} `
                      : ''}
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period */}
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Time Period
              </label>

              <select
                className="input w-full"
                value={period}
                onChange={(e) => {
                  updateFilter(() => {
                    setPeriod(e.target.value);

                    if (e.target.value !== 'custom') {
                      setCustomStart('');
                      setCustomEnd('');
                    }
                  });
                }}
              >
                <option value="all">
                  All Time
                </option>

                <option value="today">
                  Today
                </option>

                <option value="yesterday">
                  Yesterday
                </option>

                <option value="thisWeek">
                  This Week
                </option>

                <option value="thisMonth">
                  This Month
                </option>

                <option value="lastMonth">
                  Last Month
                </option>

                <option value="thisQuarter">
                  This Quarter
                </option>

                <option value="thisYear">
                  This Year
                </option>

                <option value="custom">
                  Custom Range
                </option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Sort By
              </label>

              <select
                className="input w-full"
                value={sort}
                onChange={(e) =>
                  updateFilter(() =>
                    setSort(e.target.value)
                  )
                }
              >
                <option value="-date">
                  Newest First
                </option>

                <option value="date">
                  Oldest First
                </option>

                <option value="-amount">
                  Highest Amount
                </option>

                <option value="amount">
                  Lowest Amount
                </option>
              </select>
            </div>
          </div>

          {/* Custom Range */}
          {period === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5">
                  From
                </label>

                <input
                  type="date"
                  className="input w-full"
                  value={customStart}
                  onChange={(e) =>
                    updateFilter(() =>
                      setCustomStart(e.target.value)
                    )
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">
                  To
                </label>

                <input
                  type="date"
                  className="input w-full"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) =>
                    updateFilter(() =>
                      setCustomEnd(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* Active filters / clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-ink/50 dark:text-paper/50">
                Filters are applied automatically.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-coral hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expense list */}
      <div className="card divide-y divide-mist dark:divide-mistdark">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm text-ink/40 dark:text-paper/40">
              Loading expenses…
            </p>
          </div>
        ) : data.expenses.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="font-medium mb-1">
              No expenses found
            </p>

            <p className="text-sm text-ink/50 dark:text-paper/50">
              Try changing your filters or add a new
              expense.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm text-teal hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          data.expenses.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between px-4 py-3 group gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{
                    background: `${tx.categoryId?.color}22`,
                  }}
                >
                  {tx.categoryId?.icon}
                </span>

                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {tx.categoryId?.name}

                    {tx.description
                      ? ` — ${tx.description}`
                      : ''}
                  </p>

                  <p className="text-xs text-ink/50 dark:text-paper/50">
                    {new Date(tx.date).toLocaleString(
                      'en-IN',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }
                    )}{' '}
                    · {tx.paymentMethodId?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <p className="amount font-semibold">
                  {fmt(tx.amount)}
                </p>

                {isToday(tx.date) && (
                  <button
                    onClick={() =>
                      handleDelete(tx._id)
                    }
                    className="text-ink/30 hover:text-coral transition opacity-0 group-hover:opacity-100"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data.pagination?.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {Array.from(
            {
              length: data.pagination.totalPages,
            },
            (_, i) => i + 1
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page
                  ? 'bg-teal text-paper'
                  : 'bg-mist/40 dark:bg-mistdark'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
