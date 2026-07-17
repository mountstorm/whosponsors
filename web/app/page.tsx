import Link from 'next/link';
import Search from '@/components/Search';
import { getTopCompanies } from '@/lib/db';

export default function Home() {
  const top = getTopCompanies(20);

  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="py-16 text-center sm:py-24">
        <p
          className="mx-auto mb-4 w-fit rounded-full border px-3 py-1 font-mono text-xs"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }}
        >
          15 years of USCIS filings · 324,910 employers
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Who <span style={{ color: 'var(--approvals)' }}>actually</span>{' '}
          sponsors H-1B?
        </h1>
        <p
          className="mx-auto mt-5 max-w-xl text-lg leading-relaxed"
          style={{ color: 'var(--ink-muted)' }}
        >
          Real approval and denial numbers, straight from USCIS. No
          &ldquo;visa sponsorship available&rdquo; lies.
        </p>
        <div className="mt-9">
          <Search />
        </div>
      </section>

      <section className="pb-16">
        <h2
          className="mb-4 font-mono text-sm uppercase tracking-widest"
          style={{ color: 'var(--ink-muted)' }}
        >
          Top sponsors, all time
        </h2>
        <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {top.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/company/${c.slug}`}
                className="flex items-baseline justify-between rounded-xl border px-4 py-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderColor: 'var(--hairline)',
                  background: 'var(--surface-raised)'
                }}
              >
                <span className="truncate">
                  <span
                    className="mr-3 inline-block w-6 text-right font-mono text-xs tabular-nums"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {i + 1}
                  </span>
                  {c.display_name}
                </span>
                <span
                  className="ml-4 shrink-0 font-mono text-sm tabular-nums"
                  style={{ color: 'var(--approvals)' }}
                >
                  {c.all_time_approvals.toLocaleString()}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}