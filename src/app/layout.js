import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Ledger — Personal Expense Tracker',
  description: 'Record an expense in seconds, understand your spending in minutes.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B6B5B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body bg-paper text-ink antialiased dark:bg-paperdark dark:text-paper">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
