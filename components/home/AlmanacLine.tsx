"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { almanacForMonth } from "@/lib/almanac";

const subscribe = () => () => {};

/** The month's jobs under the masthead. The homepage is built static, so the
 *  server renders the month it was built in and the browser re-reads the
 *  clock on hydration, swapping in the current month if one has turned since
 *  the last deploy. */
export default function AlmanacLine({ builtMonth }: { builtMonth: number }) {
  const month = useSyncExternalStore(subscribe, () => new Date().getMonth(), () => builtMonth);
  const entry = almanacForMonth(month);

  if (!entry) return null;

  return (
    <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink/60">
      {entry.month}:{" "}
      {entry.jobs.map((job, i) => (
        <span key={job.href}>
          {i > 0 && ", "}
          <Link href={job.href} className="text-ink font-semibold underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
            {job.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
