import type { ReactNode } from "react";
import { Stamp } from "@/components/field/kit";

/* The legal pages as filed paperwork: one manila sheet, display
   headline, §-numbered sections, mono ref footer. A working surface,
   so the sheet sits at zero degrees; only the stamps tilt. */

export default function FiledDocument({
  title,
  subtitle,
  refCode,
  stamp,
  notice,
  sections,
  footerLines,
  voided = false,
}: {
  title: string;
  subtitle: string;
  refCode: string;
  stamp: { label: string; color: string; rotate?: string };
  notice?: ReactNode;
  sections: { heading: string; body: ReactNode }[];
  footerLines: string[];
  voided?: boolean;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <article className="card-paper grain relative p-6 md:p-10">
        {voided && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[3]"
          >
            <span
              className="stamp text-rust"
              style={{
                fontSize: "clamp(2.8rem, 11vw, 5.5rem)",
                padding: "0.4rem 2rem 0.3rem",
                borderWidth: 5,
                borderRadius: 8,
                transform: "rotate(-14deg)",
                opacity: 0.4,
              }}
            >
              Void
            </span>
          </div>
        )}

        <div className="relative z-[2]">
          {/* Document header */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink/55 mb-6">
            <span>Homesteader Labs · Records</span>
            <span className="ml-auto">Ref: {refCode}</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4 mb-8">
            <div>
              <h1 className="font-display uppercase text-3xl md:text-4xl leading-[0.98] text-balance">
                {title}
              </h1>
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/60 mt-2">
                {subtitle}
              </p>
            </div>
            <Stamp
              color={stamp.color}
              rotate={stamp.rotate ?? "3deg"}
              className="shrink-0 mt-1"
            >
              {stamp.label}
            </Stamp>
          </div>

          {notice && (
            <p className="text-lg md:text-xl font-bold uppercase leading-relaxed border-l-4 border-marker pl-4 mb-10">
              <span className="hl">{notice}</span>
            </p>
          )}

          <div className="space-y-8">
            {sections.map((section, i) => (
              <section key={section.heading}>
                <h2 className="font-display uppercase text-lg leading-tight mb-2">
                  <span className="font-mono text-[0.75rem] font-semibold text-marker align-super mr-2">
                    §{i + 1}
                  </span>
                  {section.heading}
                </h2>
                <p className="text-[1.02rem] leading-relaxed text-ink/85">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* Document footer */}
          <div className="mt-12 pt-4 border-t border-dotted border-ink/40 font-mono text-[0.68rem] uppercase tracking-wider text-ink/55 leading-relaxed">
            {footerLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
