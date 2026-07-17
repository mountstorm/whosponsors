import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhoSponsors — the honest H-1B database',
  description:
    'Search any company and see who actually sponsors: H-1B approvals and denials per year, straight from USCIS data.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-mono text-lg font-bold">
            who<span style={{ color: 'var(--approvals)' }}>sponsors</span>
          </Link>
          <a
            href="https://github.com/mountstorm/whosponsors"
            className="text-sm underline-offset-4 hover:underline"
            style={{ color: 'var(--ink-muted)' }}
          >
            Data & methodology
          </a>
        </header>
        {children}
        <footer
          className="mx-auto max-w-5xl px-6 py-10 text-xs"
          style={{ color: 'var(--ink-muted)' }}
        >
          Source: USCIS H-1B Employer Data Hub, FY2009–FY2023. Not legal
          advice. Employer entities merged where clearly the same company.
        </footer>
      </body>
    </html>
  );
}