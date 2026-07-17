import Link from 'next/link';
import Search from '@/components/Search';
import { getTopCompanies } from '@/lib/db';

export default function Home() {
  const top = getTopCompanies(20);

  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Who <span style={{ color: 'var(--approvals)' }}>actually</span>{' '}
          sponsors H-1B?
        </h1>
        <p
          className="mx-auto mt-4 max-w-xl text-lg"
          style={{ color: 'var(--ink-muted)' }}
        >
          Real approval and denial numbers for 324,910 employers, straight
          from USCIS. No &ldquo;visa sponsorship available&rdquo; lies.
        </p>
        <div className="mt-8">
          <Search />
        </div>
      </section>

      <section className="pb-16">
        <h2
          className="mb-4 font-mono text-sm uppercase tracking-wide"
          style={{ color: 'var(--ink-muted)' }}
        >
          Top sponsors, all time
        </h2>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {top.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/company/${c.slug}`}
                className="flex items-baseline justify-between rounded-xl border px-4 py-3 transition-colors hover:border-current"
                style={{ borderColor: 'var(--hairline)' }}
              >
                <span className="truncate">
                  <span
                    className="mr-3 font-mono text-xs"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {i + 1}
                  </span>
                  {c.display_name}
                </span>
                <span className="ml-4 shrink-0 font-mono text-sm">
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