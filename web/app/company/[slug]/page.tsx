import { notFound } from 'next/navigation';
import Link from 'next/link';
import TrendChart from '@/components/TrendChart';
import { getCompanyBySlug, getCompanySeries } from '@/lib/db';

export default function CompanyPage({
  params
}: {
  params: { slug: string };
}) {
  const company = getCompanyBySlug(params.slug);
  if (!company) notFound();

  const series = getCompanySeries(company.company_id);
  const data = series.map((r) => ({
    year: r.fiscal_year,
    approvals: r.total_approvals,
    denials: r.total_denials
  }));

  const latest = series[series.length - 1];
  const prev = series[series.length - 2];
  const denialRate =
    company.all_time_approvals + company.all_time_denials > 0
      ? (company.all_time_denials /
          (company.all_time_approvals + company.all_time_denials)) *
        100
      : 0;
  const yoy =
    prev && prev.total_approvals > 0
      ? ((latest.total_approvals - prev.total_approvals) /
          prev.total_approvals) *
        100
      : null;

  const stats: { label: string; value: string; hint?: string }[] = [
    {
      label: `FY${latest.fiscal_year} approvals`,
      value: latest.total_approvals.toLocaleString(),
      hint:
        yoy === null
          ? undefined
          : `${yoy >= 0 ? '+' : ''}${yoy.toFixed(0)}% vs FY${prev.fiscal_year}`
    },
    {
      label: 'All-time approvals',
      value: company.all_time_approvals.toLocaleString(),
      hint: `FY${company.first_year}–FY${company.last_year}`
    },
    {
      label: 'All-time denial rate',
      value: `${denialRate.toFixed(1)}%`,
      hint: `${company.all_time_denials.toLocaleString()} denials`
    }
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16">
      <Link
        href="/"
        className="font-mono text-sm underline-offset-4 hover:underline"
        style={{ color: 'var(--ink-muted)' }}
      >
        ← search
      </Link>

      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
        {company.display_name}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <div
              className="text-xs uppercase tracking-wide"
              style={{ color: 'var(--ink-muted)' }}
            >
              {s.label}
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold">
              {s.value}
            </div>
            {s.hint && (
              <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                {s.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          H-1B petitions by fiscal year
        </h2>
        <TrendChart data={data} />
      </section>
    </main>
  );
}