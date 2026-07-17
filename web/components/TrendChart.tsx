'use client';

import { useState } from 'react';

export type YearPoint = {
  year: number;
  approvals: number;
  denials: number;
};

const W = 720;
const H = 300;
const PAD = { top: 16, right: 8, bottom: 28, left: 44 };

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  return Math.ceil(v / pow) * pow;
}

// Approvals as bars (primary story), denials as a thin line on the SAME axis.
export default function TrendChart({ data }: { data: YearPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => Math.max(d.approvals, d.denials)), 1));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(band - 2, 36); // 2px surface gap between bars

  const x = (i: number) => PAD.left + i * band + band / 2;
  const y = (v: number) => PAD.top + plotH * (1 - v / max);

  const ticks = [0, max / 2, max];
  const line = data
    .map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.denials)}`)
    .join('');

  const h = hover === null ? null : data[hover];

  return (
    <figure className="w-full">
      <div
        className="mb-2 flex gap-5 text-xs"
        style={{ color: 'var(--ink-muted)' }}
        role="list"
        aria-label="Legend"
      >
        <span role="listitem" className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: 'var(--approvals)' }}
          />
          Approvals
        </span>
        <span role="listitem" className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-3"
            style={{ background: 'var(--denials)' }}
          />
          Denials
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="H-1B approvals and denials by fiscal year"
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--hairline)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 3.5}
                textAnchor="end"
                fontSize="11"
                fill="var(--ink-muted)"
              >
                {t >= 1000 ? `${t / 1000}k` : t}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const bh = Math.max(plotH * (d.approvals / max), d.approvals > 0 ? 2 : 0);
            return (
              <rect
                key={d.year}
                x={x(i) - barW / 2}
                y={PAD.top + plotH - bh}
                width={barW}
                height={bh}
                rx="4"
                fill="var(--approvals)"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
            );
          })}

          <path d={line} fill="none" stroke="var(--denials)" strokeWidth="2" />

          {data.map((d, i) => (
            <text
              key={d.year}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink-muted)"
            >
              {String(d.year).slice(2)}
            </text>
          ))}

          {/* hover hit targets: full column, larger than the marks */}
          {data.map((d, i) => (
            <rect
              key={d.year}
              x={PAD.left + i * band}
              y={PAD.top}
              width={band}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {h && hover !== null && (
          <div
            className="pointer-events-none absolute rounded-lg border px-3 py-2 text-xs shadow-md"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--hairline)',
              left: `${((x(hover) / W) * 100).toFixed(1)}%`,
              top: 0,
              transform: `translateX(${hover > data.length / 2 ? '-110%' : '10%'})`
            }}
          >
            <div className="font-semibold">FY{h.year}</div>
            <div style={{ color: 'var(--approvals)' }}>
              {h.approvals.toLocaleString()} approvals
            </div>
            <div style={{ color: 'var(--denials)' }}>
              {h.denials.toLocaleString()} denials
            </div>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary style={{ color: 'var(--ink-muted)' }} className="cursor-pointer">
          View as table
        </summary>
        <table className="mt-2 w-full max-w-md text-left font-mono text-xs">
          <thead style={{ color: 'var(--ink-muted)' }}>
            <tr>
              <th className="py-1 pr-4 font-normal">Fiscal year</th>
              <th className="py-1 pr-4 font-normal">Approvals</th>
              <th className="py-1 font-normal">Denials</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.year}>
                <td className="py-0.5 pr-4">{d.year}</td>
                <td className="py-0.5 pr-4">{d.approvals.toLocaleString()}</td>
                <td className="py-0.5">{d.denials.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}