'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Result = {
  slug: string;
  display_name: string;
  all_time_approvals: number;
  first_year: number;
  last_year: number;
};

export default function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal
        });
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
          setActive(-1);
        }
      } catch (err) {
        // Aborting a stale request on keystroke is expected, not an error.
        if ((err as Error).name !== 'AbortError') throw err;
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/company/${slug}`);
  };

  return (
    <div ref={boxRef} className="relative mx-auto w-full max-w-xl">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown')
            setActive((a) => Math.min(a + 1, results.length - 1));
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
          else if (e.key === 'Enter' && active >= 0) go(results[active].slug);
          else if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Search any company… e.g. Google, Deloitte, Nvidia"
        aria-label="Search companies"
        className="w-full rounded-2xl border px-5 py-4 font-mono text-base outline-none focus:ring-2"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--hairline)',
          color: 'var(--ink)'
        }}
        autoFocus
      />
      {open && results.length > 0 && (
        <ul
          className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--hairline)' }}
        >
          {results.map((r, i) => (
            <li key={r.slug}>
              <button
                onClick={() => go(r.slug)}
                onMouseEnter={() => setActive(i)}
                className="flex w-full items-baseline justify-between px-5 py-3 text-left"
                style={{
                  background: i === active ? 'var(--hairline)' : 'transparent'
                }}
              >
                <span className="truncate font-medium">{r.display_name}</span>
                <span
                  className="ml-4 shrink-0 font-mono text-xs"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {r.all_time_approvals.toLocaleString()} approvals
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}