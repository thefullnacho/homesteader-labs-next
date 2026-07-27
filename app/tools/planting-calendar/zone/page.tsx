import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";
import { ZONE_PAGES, getZonePageData } from "@/lib/tools/planting-calendar/zonePages";

// Same reasoning as the zone pages themselves: a pure function of the frost
// normals, so it prerenders.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Planting Calendar by Zone: Frost Dates for Zones 5a to 9b",
  description:
    "Frost dates, season length and fall sowing deadlines for USDA zones 5a through 9b, " +
    "covering 88% of US ZIP codes. Pick your zone for its full sowing schedule.",
  alternates: { canonical: "/tools/planting-calendar/zone/" },
};

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function ZoneIndexPage() {
  const zones = ZONE_PAGES.map((zone) => {
    const d = getZonePageData(zone);
    return { zone, data: d, stillSowable: d.fallSowing().length };
  });

  return (
    <>
      <section className="bg-kraft grain border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 py-10 relative z-[2]">
          <div className="flex items-start justify-between gap-4 mb-5 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/60">
            <span>
              <Link href="/tools/" className="hover:text-marker">Tools</Link>
              {" / "}
              <Link href="/tools/planting-calendar/" className="hover:text-marker">
                Planting Calendar
              </Link>
              {" / "}Zones
            </span>
            <span className="text-right shrink-0">{ZONE_PAGES.length} zones, 88% of US ZIPs</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Stamp>Zones 5a-9b</Stamp>
            <Stamp>NOAA 1991-2020</Stamp>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Planting Calendar by Zone
          </h1>
          <p className="font-serif italic text-lg text-ink/75 mt-4 max-w-2xl">
            Every date on this site is counted from two numbers: your last spring frost and your
            first fall frost. Pick your zone and everything else follows.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <section className="pt-12">
          <SectionHead
            no="§1"
            title="Find your zone"
            right={<span className="font-mono text-[0.64rem]">coldest first</span>}
          />
          <p className="font-serif text-ink/75 mb-6 max-w-2xl">
            Not sure which is yours? The{" "}
            <Link
              href="/tools/planting-calendar/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              planting calendar
            </Link>{" "}
            resolves it from your ZIP against the USDA 2023 map, rather than asking you to read a
            colour off a picture. These ten zones hold 35,589 of the 40,502 ZIPs in that table. The
            sixteen we have left out each hold under 1,300, and several under thirty.
          </p>

          <div className="card-paper grain overflow-hidden">
            <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
              <table className="w-full font-mono text-[0.76rem] min-w-[540px]">
                <thead>
                  <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                    <th className="py-1.5 pr-3 font-semibold">Zone</th>
                    <th className="py-1.5 pr-3 font-semibold">Last frost</th>
                    <th className="py-1.5 pr-3 font-semibold">First frost</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Season</th>
                    <th className="py-1.5 font-semibold text-right">Sowable now</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(({ zone, data, stillSowable }) => (
                    <tr key={zone} className="h-[38px] border-t border-dotted border-ink/20">
                      <td className="py-1.5 pr-3">
                        <Link
                          href={`/tools/planting-calendar/zone/${zone}/`}
                          className="font-bold underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                        >
                          Zone {zone}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-ink/70">{fmt(data.lastSpringFrost)}</td>
                      <td className="py-1.5 pr-3 text-marker">{fmt(data.firstFallFrost)}</td>
                      <td className="py-1.5 pr-3 text-right text-ink/70">{data.frostFreeDays}d</td>
                      <td className="py-1.5 text-right">{stillSowable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="font-serif text-ink/75 mt-5 max-w-2xl">
            &quot;Sowable now&quot; counts the crops that still finish before that zone&apos;s first
            frost if they go in today. It falls to zero as the season closes, coldest zones first,
            which is the whole reason fall planting is a deadline rather than a plan.
          </p>
        </section>

        <section className="pt-14">
          <SectionHead no="§2" title="Why zones, not cities" />
          <p className="font-serif text-ink/75 max-w-2xl">
            Two cities in the same zone share a frost date, so they render an identical schedule.
            Buffalo and Rochester are both 6a. Zones differ from each other in a way cities in the
            same zone do not: every crop&apos;s sowing date shifts between every adjacent pair,
            because frost normals move ten to twenty days per half-zone. Ten substantive pages beat
            five hundred thin ones.
          </p>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 pt-16">
          Frost normals: NOAA 1991-2020 climate normals. Zone lookup: PRISM 2023.
        </p>
      </div>
    </>
  );
}
