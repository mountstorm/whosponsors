'use client';

import { useState } from 'react';

export type YearPoint = {
  year: number;
  approvals: number;
  denials: number | null; // null = not published for that year (FY2024+)
};

const W = 760;
const H = 340;
const PAD = { top: 20, right: 20, bottom: 40, left: 56 };

function niceMax(v: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(v, 1)));
  const unit = pow / 2;
  return Math.ceil(v / unit) * unit;
}

function fmt(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v);
}

// X-Y plane: fiscal year on x, petitions on y. Approvals and denials as
// 2px lines with point markers, crosshair + tooltip on hover.
export default function TrendChart({ data }: { data: YearPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = niceMax(
    Math.max(...data.map((d) => Math.max(d.approvals, d.denials ?? 0)), 1)
  );
  const denialPoints = data
    .map((d, i) => ({ ...d, i }))
    .filter((d): d is typeof d & { denials: number } => d.denials !== null);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH * (1 - v / max);

  const approvalsPath = data
    .map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.approvals)}`)
    .join('');
  const denialsPath = denialPoints
    .map((d, j) => `${j ? 'L' : 'M'}${x(d.i)},${y(d.denials)}`)
    .join('');

  const area =
    approvalsPath + ` L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  // Thin x labels when the series is long so they never collide.
  const xStep = data.length > 10 ? 2 : 1;

  const h = hover === null ? null : data[hover];

  return (
    <figure className="w-full">
      <div
        className="mb-3 flex gap-6 text-sm"
        style={{ color: 'var(--ink-muted)' }}
        role="list"
        aria-label="Legend"
      >
        <span role="listitem" className="flex items-center gap-2">
          <span
            className="inline-block h-[3px] w-5 rounded-full"
            style={{ background: 'var(--approvals)' }}
          />
          Approvals
        </span>
        <span role="listitem" className="flex items-center gap-2">
          <span
            className="inline-block h-[3px] w-5 rounded-full"
            style={{ background: 'var(--denials)' }}
          />
          Denials
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="H-1B approvals and denials by fiscal year"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="approvalsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--approvals)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--approvals)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* gridlines + y labels */}
          {yTicks.map((t) => (
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
                x={PAD.left - 10}
                y={y(t) + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--ink-muted)"
              >
                {fmt(t)}
              </text>
            </g>
          ))}

          {/* axes */}
          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={y(0)}
            stroke="var(--axis)"
            strokeWidth="1.5"
          />
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--axis)"
            strokeWidth="1.5"
          />

          {/* x labels */}
          {data.map((d, i) =>
            i % xStep === 0 ? (
              <text
                key={d.year}
                x={x(i)}
                y={H - 12}
                textAnchor="middle"
                fontSize="12"
                fill="var(--ink-muted)"
              >
                {d.year}
              </text>
            ) : null
          )}

          <path d={area} fill="url(#approvalsFill)" />
          <path
            d={approvalsPath}
            fill="none"
            stroke="var(--approvals)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {denialsPath && (
            <path
              d={denialsPath}
              fill="none"
              stroke="var(--denials)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}

          {/* crosshair */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={y(0)}
              stroke="var(--axis)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* point markers, ringed with surface so overlaps stay legible */}
          {data.map((d, i) => (
            <g key={d.year}>
              <circle
                cx={x(i)}
                cy={y(d.approvals)}
                r={hover === i ? 5.5 : 4}
                fill="var(--approvals)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
              {d.denials !== null && (
                <circle
                  cx={x(i)}
                  cy={y(d.denials)}
                  r={hover === i ? 5 : 3.5}
                  fill="var(--denials)"
                  stroke="var(--surface)"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}

          {/* hover hit columns, larger than the marks */}
          {data.map((d, i) => (
            <rect
              key={d.year}
              x={x(i) - (plotW / Math.max(data.length - 1, 1)) / 2}
              y={PAD.top}
              width={plotW / Math.max(data.length - 1, 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl border px-4 py-3 text-sm shadow-lg"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--hairline)',
              left: `${((x(hover) / W) * 100).toFixed(1)}%`,
              transform: `translateX(${hover > data.length / 2 ? '-112%' : '12%'})`
            }}
          >
            <div className="font-semibold">FY{h.year}</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: 'var(--approvals)' }}
              />
              <span className="font-mono">{h.approvals.toLocaleString()}</span>
              <span style={{ color: 'var(--ink-muted)' }}>approvals</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: 'var(--denials)' }}
              />
              <span className="font-mono">
                {h.denials === null ? '—' : h.denials.toLocaleString()}
              </span>
              <span style={{ color: 'var(--ink-muted)' }}>
                {h.denials === null ? 'denials not published' : 'denials'}
              </span>
            </div>
          </div>
        )}
      </div>

      <details className="mt-4 text-sm">
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
                <td className="py-0.5">
                  {d.denials === null ? '—' : d.denials.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
