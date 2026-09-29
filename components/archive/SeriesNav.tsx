import Link from "next/link";
import type { Post } from "@/lib/posts";
import { HUBS, seriesMonth } from "@/lib/hubs";

/* Monthly foraging series: prev/next plus the whole run, at the foot of each
   issue. A working surface, so zero degrees and no props. The series comes
   from lib/hubs.ts, so a new month appears here the day its post merges. */
export default function SeriesNav({ current, series }: { current: Post; series: Post[] }) {
  const i = series.findIndex((p) => p.slug === current.slug);
  if (i === -1) return null;
  const prev = series[i - 1];
  const next = series[i + 1];

  return (
    <nav aria-label="What to forage, month by month" className="mt-12 card-paper grain no-print">
      <div className="border-b-2 border-ink px-4 py-2 flex items-center justify-between gap-3 relative z-[2]">
        <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
          What to forage, month by month
        </span>
        <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/55 shrink-0 whitespace-nowrap">
          {i + 1} of {series.length}
        </span>
      </div>

      {(prev || next) && (
        <div className="grid sm:grid-cols-2 border-b border-dotted border-ink/40 relative z-[2]">
          {prev ? (
            <Link
              href={`/archive/${prev.slug}/`}
              rel="prev"
              className="group px-4 py-4 sm:border-r border-dotted border-ink/40"
            >
              <span className="block font-mono text-[0.66rem] uppercase tracking-wider text-ink/55">
                ← Previous: {seriesMonth(prev.slug)}
              </span>
              <span className="block mt-1 font-display uppercase text-[0.95rem] leading-tight group-hover:text-marker transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block sm:border-r border-dotted border-ink/40" />
          )}
          {next && (
            <Link
              href={`/archive/${next.slug}/`}
              rel="next"
              className="group px-4 py-4 sm:text-right border-t sm:border-t-0 border-dotted border-ink/40"
            >
              <span className="block font-mono text-[0.66rem] uppercase tracking-wider text-ink/55">
                Next: {seriesMonth(next.slug)} →
              </span>
              <span className="block mt-1 font-display uppercase text-[0.95rem] leading-tight group-hover:text-marker transition-colors">
                {next.title}
              </span>
            </Link>
          )}
        </div>
      )}

      {/* The whole run: the series index block */}
      <ol className="px-4 py-2 relative z-[2]">
        {series.map((p) => {
          const here = p.slug === current.slug;
          return (
            <li
              key={p.slug}
              className="flex gap-3 py-1.5 items-baseline border-b border-dotted border-ink/25 last:border-b-0"
            >
              <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink/55 w-24 shrink-0">
                {seriesMonth(p.slug)}
              </span>
              {here ? (
                <span className="text-[0.95rem] leading-snug font-semibold" aria-current="page">
                  {p.title} <span className="font-mono text-[0.64rem] uppercase text-marker whitespace-nowrap">you are here</span>
                </span>
              ) : (
                <Link
                  href={`/archive/${p.slug}/`}
                  className="text-[0.95rem] leading-snug underline decoration-ink/30 underline-offset-4 hover:text-marker hover:decoration-marker"
                >
                  {p.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t-2 border-ink px-4 py-2 font-mono text-[0.68rem] uppercase tracking-wider relative z-[2]">
        <Link
          href={HUBS.foraging.path}
          className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
        >
          All foraging guides
        </Link>
        <span className="text-ink/55">, the wild berry guide first.</span>
      </div>
    </nav>
  );
}
