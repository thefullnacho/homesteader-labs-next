import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, siteRef, breadcrumbList, pageGraph } from "@/lib/schema";
import { STATE_PAGES, getStatePageData } from "@/lib/tools/planting-calendar/statePages";

// Same reasoning as everything else under this tool: pure function of the
// vendored tables, so it prerenders.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Planting Calendar by State: Zone Spread and Frost Dates",
  description:
    "How many hardiness zones each state actually contains, and how many days separate the " +
    "coldest from the warmest. Find your zone by ZIP, then plant on its dates rather than " +
    "the state average.",
  alternates: { canonical: "/tools/planting-calendar/state/" },
};

export default function StateIndexPage() {
  // Sorted widest spread first: the states where the state average is most
  // misleading are the ones a reader most needs to click through from.
  const states = STATE_PAGES.map(getStatePageData).sort((a, b) => b.spreadDays - a.spreadDays);

  return (
    <>
      <JsonLd
        data={pageGraph(
          breadcrumbList([
            { name: "Planting Calendar", path: "/tools/planting-calendar/" },
            { name: "By State", path: "/tools/planting-calendar/state/" },
          ]),
          {
            "@type": "CollectionPage",
            "@id": `${SITE_URL}/tools/planting-calendar/state/`,
            url: `${SITE_URL}/tools/planting-calendar/state/`,
            name: "Planting Calendar by State",
            description:
              "Hardiness zone spread and frost dates for each state, with a ZIP lookup to the " +
              "zone that decides your planting dates.",
            isPartOf: siteRef,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: states.length,
              itemListElement: states.map((s, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: `${s.name} Planting Calendar`,
                url: `${SITE_URL}/tools/planting-calendar/state/${s.slug}/`,
              })),
            },
          }
        )}
      />

      <section className="bg-kraft grain border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 py-10 relative z-[2]">
          <div className="flex items-start justify-between gap-4 mb-5 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/60">
            <span>
              <Link href="/tools/" className="hover:text-marker">Tools</Link>
              {" / "}
              <Link href="/tools/planting-calendar/" className="hover:text-marker">
                Planting Calendar
              </Link>
              {" / "}States
            </span>
            <span className="text-right shrink-0">{states.length} states</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Stamp>PRISM 2023</Stamp>
            <Stamp>Census ZCTA</Stamp>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Planting Calendar by State
          </h1>
          <p className="font-serif italic text-lg text-ink/75 mt-4 max-w-2xl">
            No state is one growing region. The question a state page answers is how many
            calendars yours actually contains, and which of them is yours.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <section className="pt-12">
          <SectionHead
            no="§1"
            title="How far apart a state runs"
            right={<span className="font-mono text-[0.64rem]">widest first</span>}
          />
          <p className="font-serif text-ink/75 mb-6 max-w-2xl">
            Spread is the number of days between the last spring frost in the state&apos;s coldest
            material band and its warmest. It is the measure of how wrong a single state-wide
            planting date can be, and in the widest states here it is most of a season.
          </p>

          <div className="card-paper grain overflow-hidden">
            <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
              <table className="w-full font-mono text-[0.76rem] min-w-[560px]">
                <thead>
                  <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                    <th className="py-1.5 pr-3 font-semibold">State</th>
                    <th className="py-1.5 pr-3 font-semibold">Zones</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Bands</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Spread</th>
                    <th className="py-1.5 font-semibold text-right">Season</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((s) => (
                    <tr key={s.slug} className="h-[38px] border-t border-dotted border-ink/20">
                      <td className="py-1.5 pr-3">
                        <Link
                          href={`/tools/planting-calendar/state/${s.slug}/`}
                          className="font-bold underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-ink/70">
                        {s.bands[0].zone} to {s.bands[s.bands.length - 1].zone}
                      </td>
                      <td className="py-1.5 pr-3 text-right text-ink/70">{s.bands.length}</td>
                      <td className="py-1.5 pr-3 text-right text-marker">{s.spreadDays}d</td>
                      <td className="py-1.5 text-right text-ink/70">
                        {s.seasonRange[0]}-{s.seasonRange[1]}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="font-serif text-ink/75 mt-5 max-w-2xl">
            A band is a zone holding at least 2% of the state&apos;s ZIP codes. Smaller pockets
            exist nearly everywhere and are named on each state&apos;s page, but tabulating a zone
            that covers a fraction of a percent of a state invites the other 99% to follow the
            wrong link.
          </p>
        </section>

        <section className="pt-14">
          <SectionHead no="§2" title="Why ten states, and not fifty" />
          <p className="font-serif text-ink/75 max-w-2xl">
            Because a complete set of thin pages is worth less than a short set of substantial
            ones, and we have already proven that on this site the expensive way. These ten were
            picked to span the range: Kentucky is effectively a single calendar with an edge case,
            Texas contains seven genuinely different ones. If the shape holds across all three, the
            rest of the country follows. If it does not, no amount of coverage would have saved it.
          </p>
          <p className="font-serif text-ink/75 mt-4 max-w-2xl">
            If you already know your zone, skip the state entirely and go straight to{" "}
            <Link
              href="/tools/planting-calendar/zone/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              the zone calendars
            </Link>
            . The state is a way of finding the zone, not a substitute for it.
          </p>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 pt-16">
          Zone boundaries PRISM 2023 · ZIP to state US Census 2020 ZCTA relationship file ·
          frost normals NOAA 1991-2020
        </p>
      </div>
    </>
  );
}
