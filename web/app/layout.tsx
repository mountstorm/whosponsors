import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'WhoSponsors — the honest H-1B database',
  description:
    'Search any company and see who actually sponsors: H-1B approvals and denials per year, straight from USCIS data.'
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="group relative">
            <Link href="/" className="font-mono text-lg font-bold tracking-tight">
              who<span style={{ color: 'var(--approvals)' }}>sponsors</span>
            </Link>
            <div
              className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border p-4 text-sm opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--hairline)',
                color: 'var(--ink-muted)'
              }}
              role="tooltip"
            >
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                The honest H-1B database
              </p>
              <p className="mt-1.5 leading-relaxed">
                Real approval &amp; denial numbers for 324,910 employers,
                FY2009–FY2023, straight from USCIS filings — so international
                students and workers can see who actually sponsors before
                applying.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4" style={{ color: 'var(--ink-muted)' }}>
            <a
              href="https://github.com/mountstorm/whosponsors"
              aria-label="GitHub repository"
              className="transition-colors hover:text-[color:var(--ink)]"
            >
              <GitHubIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/muzaffar-"
              aria-label="Muzaffar on LinkedIn"
              className="transition-colors hover:text-[color:var(--ink)]"
            >
              <LinkedInIcon />
            </a>
          </div>
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