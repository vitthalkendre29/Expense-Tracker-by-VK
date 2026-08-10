# Ledger — Personal Expense Tracker

Next.js 14 (App Router) + MongoDB/Mongoose + NextAuth + Tailwind. Mobile-first, responsive to tablet and desktop.

## What's implemented (Phases 1–6)

- **Auth**: email/password (bcrypt-hashed) + Google OAuth, JWT sessions, protected routes via middleware, every API route scoped to the signed-in `userId`.
- **Data layer**: Mongoose models — `User`, `Category`, `PaymentMethod`, `Expense`, `Budget`, `RecurringExpense` — with compound indexes on `userId + date`, `userId + categoryId`.
- **Fast expense entry**: bottom-sheet modal on mobile / centered modal on desktop, category chips, sub-10-second flow, save confirmation.
- **Dashboard**: today + month summary cards, month-over-month % change, spending trend chart, category donut, recent transactions, empty states.
- **Calendar**: monthly heatmap (color intensity by spend), click a day to see that day's transactions.
- **Analytics**: week / month / quarter / year toggle, trend chart, category + payment-method breakdown, period-over-period comparison — all computed with MongoDB aggregation pipelines (not client-side).
- **Expense history**: search, pagination, delete with confirmation.
- **Budgets**: overall monthly budget with progress bar and 75/90/100% status coloring.
- **Responsive nav**: sidebar (desktop/tablet) + bottom nav with prominent center "+" (mobile).
- **Design system**: teal/amber/coral "ledger" palette, tabular-mono amounts, Sora display + Inter body type, dark mode class support.

## Not yet built (Phases 7–10 — see roadmap below)

Recurring-expense auto-generation, receipt upload to cloud storage, CSV/PDF export, smart insights text generation, notifications, category-level budgets in the UI, custom category creation UI, full accessibility/dark-mode toggle UI, rate limiting, caching layer.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and NEXTAUTH_SECRET
npm run dev
```

Generate a secret: `openssl rand -base64 32`

MongoDB: create a free cluster at mongodb.com/cloud/atlas, whitelist your IP, copy the connection string into `MONGODB_URI`.

Google login is optional — the app works with email/password alone. To enable Google, add OAuth credentials from Google Cloud Console and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Folder structure

```
src/
  app/
    (dashboard)/         # protected route group: dashboard, expenses, calendar, analytics, settings
    api/                 # route handlers: auth, expenses, categories, payment-methods, budgets
    login/ register/
  components/
    layout/               # Sidebar, BottomNav, DashboardShell
    dashboard/             # charts, calendar heatmap
    expenses/               # AddExpenseModal
  lib/                    # db.js (connection), auth.js, session.js, analytics.js
  models/                 # Mongoose schemas
```

## Full roadmap (all 38 spec sections, phased)

**Phase 7 — Recurring & budgets++**
- Cron/serverless scheduled function to auto-generate recurring expenses from `RecurringExpense` documents (daily/weekly/monthly/quarterly/yearly).
- Category-level budgets in Settings UI; budget creation modal instead of inline form.
- Recurring expense management page (create/edit/pause).

**Phase 8 — Insights, search++, receipts, reports**
- Smart insights: a scheduled job or on-demand endpoint that runs comparison aggregations ("+18% on Food this month", "highest spend on Saturdays") and stores results per user.
- Advanced filter panel on Expenses page: category, payment method, amount range, date range, tags.
- Receipt upload via a storage provider (S3/Cloudinary) — store only the URL in `receiptUrl`, generate signed URLs for private access.
- CSV export (simple), Excel export (`exceljs`), PDF report (`@react-pdf/renderer` or Puppeteer) with charts + transaction list.

**Phase 9 — Polish**
- Theme toggle wired to `next-themes`, persisted to `User.theme`.
- Full keyboard navigation + ARIA labels audit.
- Skeleton loading states, empty states on every analytics view.
- Custom category creation UI (icon/color picker) — model already supports it.

**Phase 10 — Hardening & scale**
- Rate limiting on mutation routes (e.g. `@upstash/ratelimit`).
- Redis or in-memory cache for month/year aggregations on high-traffic accounts.
- Structured logging (pino) + centralized error boundary.
- DB backup strategy (MongoDB Atlas continuous backups) + account-deletion confirmation flow with data export first.

**Future-ready (per original spec, architecture already allows adding):**
income tracking, savings goals, debt tracking, multi-currency, bank/UPI import, OCR receipt scanning, AI insights, shared/family expenses, offline PWA sync.
