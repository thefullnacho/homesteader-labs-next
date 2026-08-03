import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead, Stamp } from "@/components/field/kit";
import StateZipResolver from "@/components/planting-calendar/StateZipResolver";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, orgRef, siteRef, breadcrumbList, pageGraph } from "@/lib/schema";
import {
  STATE_PAGES,
  getStatePageData,
  isPageState,
} from "@/lib/tools/planting-calendar/statePages";
import { ZONE_PAGES } from "@/lib/tools/planting-calendar/zonePages";
import { stateBySlug } from "@/lib/tools/planting-calendar/stateTable";

// Static at build time, same reasoning as the zone route: everything on the
// page is a pure function of two vendored tables.
export const dynamic = "force-static";

export function generateStaticParams() {
  return STATE_PAGES.map((state) => ({ state }));
}

type Props = { params: Promise<{ state: string }> };

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const pct = (share: number) => `${Math.round(share * 100)}%`;

/** Five is a glance. The full list is one click away on the zone page. */
const SOW_ROWS_PER_BAND = 5;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { state } = await props.params;
  if (!isPageState(state)) return { title: "State not found" };

  const d = getStatePageData(state);
  const lo = d.bands[0].zone;
  const hi = d.bands[d.bands.length - 1].zone;

  return {
    // Interpolated past the state name on purpose: spec §6. A templated title
    // is what the city pages shipped and what got them classified as duplicate.
    title: `${d.name} Planting Calendar: Zones, Frost Dates and What to Plant Now`,
    description:
      `${d.name} spans zones ${lo} to ${hi}, a ${d.spreadDays}-day spread in last frost across ` +
      `${d.bands.length} bands. Find your zone by ZIP and see what still has time to finish.`,
    alternates: { canonical: `/tools/planting-calendar/state/${d.slug}/` },
  };
}

export default async function StatePage(props: Props) {
  const { state } = await props.params;
  if (!isPageState(state)) notFound();

  const d = getStatePageData(state);
  const coldest = d.bands[0];
  const warmest = d.bands[d.bands.length - 1];
  const sowing = d.nowSowing().filter((s) => s.rows.length > 0);
  const uncovered = d.bands.filter((b) => !b.hasPage);
  const path = `/tools/planting-calendar/state/${d.slug}/`;

  return (
    <>
      <JsonLd
        data={pageGraph(
          breadcrumbList([
            { name: "Planting Calendar", path: "/tools/planting-calendar/" },
            { name: "By State", path: "/tools/planting-calendar/state/" },
            { name: d.name, path },
          ]),
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}${path}`,
            url: `${SITE_URL}${path}`,
            name: `${d.name} Planting Calendar`,
            isPartOf: siteRef,
            publisher: orgRef,
            inLanguage: "en",
            // Not LocalBusiness, which the superseded city plan reached for and
            // which we do not qualify as. The page is about a place; it is not
            // a business located in one.
            spatialCoverage: {
              "@type": "State",
              name: d.name,
              address: {
                "@type": "PostalAddress",
                addressRegion: d.abbr,
                addressCountry: "US",
              },
            },
          }
        )}
      />

      {/* ---------- HEADER BAND ---------- */}
      <section className="bg-kraft grain border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 py-10 relative z-[2]">
          <div className="flex items-start justify-between gap-4 mb-5 font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/60">
            <span>
              <Link href="/tools/" className="hover:text-marker">Tools</Link>
              {" / "}
              <Link href="/tools/planting-calendar/" className="hover:text-marker">
                Planting Calendar
              </Link>
              {" / "}{d.name}
            </span>
            <span className="text-right shrink-0">
              {d.bands.length} zones, {d.spreadDays} days apart
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Stamp>{d.name}</Stamp>
            <Stamp>PRISM 2023</Stamp>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            {d.name} Planting Calendar
          </h1>
          <p className="font-serif italic text-lg text-ink/75 mt-4 max-w-2xl">
            {coldest.lastSpringFrost && warmest.lastSpringFrost ? (
              <>
                Last frost runs from {fmt(coldest.lastSpringFrost)} in zone {coldest.zone} to{" "}
                {fmt(warmest.lastSpringFrost)} in zone {warmest.zone}. Which of those is yours
                decides every date that follows.
              </>
            ) : (
              <>
                {d.name} spans zone {coldest.zone} to zone {warmest.zone}, and the warm end runs
                frost-free. Which band is yours decides every date that follows.
              </>
            )}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* ---------- §1 THE SPREAD ---------- */}
        <section className="pt-12">
          <SectionHead no="§1" title="The spread" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              [
                `Coldest band, zone ${coldest.zone}`,
                coldest.lastSpringFrost ? fmt(coldest.lastSpringFrost) : "no frost data",
                `${pct(coldest.share)} of the state`,
              ],
              [
                `Warmest band, zone ${warmest.zone}`,
                warmest.lastSpringFrost ? fmt(warmest.lastSpringFrost) : "effectively frost-free",
                `${pct(warmest.share)} of the state`,
              ],
              [
                "Spread",
                `${d.spreadDays} days`,
                `season ${d.seasonRange[0]}-${d.seasonRange[1]} days`,
              ],
            ].map(([label, value, note]) => (
              <div key={label} className="card-paper grain p-5">
                <div className="relative z-[2]">
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/55">
                    {label}
                  </div>
                  <div className="font-display uppercase text-2xl mt-1">{value}</div>
                  <div className="font-mono text-[0.62rem] text-ink/50 mt-1">{note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-paper grain p-5 mt-6">
            <div className="relative z-[2]">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-marker mb-2">
                {d.shape.headline}
              </div>
              <p className="font-serif text-ink/85 max-w-2xl">{d.shape.body}</p>
            </div>
          </div>
        </section>

        {/* ---------- §2 FIND YOUR ZONE ---------- */}
        <section className="pt-14">
          <SectionHead no="§2" title="Find your zone" />
          <p className="font-serif text-ink/75 mb-5 max-w-2xl">
            This is the only input that matters. It resolves against the USDA 2023 map rather than
            asking you to read a colour off a picture, and it sends you to that zone&apos;s full
            schedule.
          </p>
          <StateZipResolver stateName={d.name} pageZones={ZONE_PAGES} />
        </section>

        {/* ---------- §3 WHAT TO PLANT NOW, BY BAND ---------- */}
        <section className="pt-14">
          <SectionHead
            no="§3"
            title="What to plant now, by band"
            right={
              <span className="font-mono text-[0.64rem]">
                {sowing.length} of {d.bands.length} bands still open
              </span>
            }
          />
          {sowing.length === 0 ? (
            <p className="font-serif text-ink/75 max-w-2xl">
              Nothing, anywhere in {d.name}. Every cool-season crop in the database now needs more
              days than the warmest band here has left before its first frost. The sowing season
              has closed statewide, and the next window opens in spring.
            </p>
          ) : (
            <>
              <p className="font-serif text-ink/75 mb-5 max-w-2xl">
                One table, not one per zone, because the comparison is the point. The gap between
                the first row and the last is the {d.spreadDays}-day spread made concrete: the warm
                end of {d.name} has weeks the cold end does not. Each band shows its {SOW_ROWS_PER_BAND}{" "}
                most urgent crops, earliest deadline first.
              </p>
              <div className="card-paper grain overflow-hidden">
                <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
                  <table className="w-full font-mono text-[0.76rem] min-w-[560px]">
                    <thead>
                      <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                        <th className="py-1.5 pr-3 font-semibold">Band</th>
                        <th className="py-1.5 pr-3 font-semibold">Sow by</th>
                        <th className="py-1.5 pr-3 font-semibold">Crop</th>
                        <th className="py-1.5 pr-3 font-semibold text-right">Days</th>
                        <th className="py-1.5 font-semibold text-right">Cal/plant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sowing.map(({ band, rows }) =>
                        rows.slice(0, SOW_ROWS_PER_BAND).map((r, i) => (
                          <tr
                            key={`${band.zone}-${r.cropId}`}
                            className="h-[34px] border-t border-dotted border-ink/20"
                          >
                            <td className="py-1.5 pr-3">
                              {i === 0 ? (
                                <Link
                                  href={`/tools/planting-calendar/zone/${band.zone}/`}
                                  className="font-bold underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                                >
                                  {band.zone}
                                </Link>
                              ) : (
                                <span className="text-ink/30">&#8226;</span>
                              )}
                            </td>
                            <td className="py-1.5 pr-3 text-marker">{fmtShort(r.sowBy)}</td>
                            <td className="py-1.5 pr-3">{r.cropName}</td>
                            <td className="py-1.5 pr-3 text-right text-ink/60">{r.adjustedDays}</td>
                            <td className="py-1.5 text-right">{r.caloriesPerPlant ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="font-serif text-ink/75 mt-5 max-w-2xl">
                Deadlines are counted back from each band&apos;s own first frost, with two weeks
                added to every crop&apos;s maturity because autumn growth is slower than the summer
                days those figures were measured in. Follow a band&apos;s link for its full list.
              </p>
            </>
          )}
        </section>

        {/* ---------- §4 ZONES IN THIS STATE ---------- */}
        <section className="pt-14">
          <SectionHead
            no="§4"
            title={`Zones in ${d.name}`}
            right={<span className="font-mono text-[0.64rem]">coldest first</span>}
          />
          <div className="card-paper grain overflow-hidden">
            <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
              <table className="w-full font-mono text-[0.76rem] min-w-[560px]">
                <thead>
                  <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                    <th className="py-1.5 pr-3 font-semibold">Zone</th>
                    <th className="py-1.5 pr-3 font-semibold text-right">Share</th>
                    <th className="py-1.5 pr-3 font-semibold">Last frost</th>
                    <th className="py-1.5 pr-3 font-semibold">First frost</th>
                    <th className="py-1.5 font-semibold text-right">Season</th>
                  </tr>
                </thead>
                <tbody>
                  {d.bands.map((b) => (
                    <tr key={b.zone} className="h-[38px] border-t border-dotted border-ink/20">
                      <td className="py-1.5 pr-3">
                        {b.hasPage ? (
                          <Link
                            href={`/tools/planting-calendar/zone/${b.zone}/`}
                            className="font-bold underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                          >
                            Zone {b.zone}
                          </Link>
                        ) : (
                          <span className="font-bold text-ink/70">Zone {b.zone}</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-3 text-right text-ink/70">{pct(b.share)}</td>
                      <td className="py-1.5 pr-3 text-ink/70">
                        {b.lastSpringFrost ? fmtShort(b.lastSpringFrost) : "none"}
                      </td>
                      <td className="py-1.5 pr-3 text-marker">
                        {b.firstFallFrost ? fmtShort(b.firstFallFrost) : "none"}
                      </td>
                      <td className="py-1.5 text-right text-ink/70">
                        {b.frostFreeDays ? `${b.frostFreeDays}d` : "year-round"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="font-serif text-ink/75 mt-5 max-w-2xl">
            Share is the percentage of {d.name} ZIP codes in that band, from the PRISM 2023 map.
            It is area-weighted, so a rural band covering half the map may hold a good deal fewer
            gardeners than its number suggests.
            {d.minorZones.length > 0 && (
              <>
                {" "}
                {d.minorZones.length === 1 ? "Zone" : "Zones"} {d.minorZones.join(", ")}{" "}
                {d.minorZones.length === 1 ? "is" : "are"} also present in {d.name} but{" "}
                {d.minorZones.length === 1 ? "holds" : "hold"} under 2% of its ZIP codes each, too
                little to be worth a row here.
              </>
            )}
          </p>

          {/* ---------- 5.6 UNCOVERED BANDS ---------- */}
          {uncovered.length > 0 && (
            <div className="card-paper grain p-5 mt-6">
              <div className="relative z-[2]">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-rust mb-2">
                  {pct(1 - d.coverage)} of {d.name} has no calendar page
                </div>
                <p className="font-serif text-ink/85 max-w-2xl">
                  {uncovered.map((b) => `Zone ${b.zone}`).join(", ")}{" "}
                  {uncovered.length === 1 ? "is" : "are"} frost-free, or near enough that NOAA
                  records no reliable 32°F date to count from. A calendar there is a heat calendar
                  rather than a frost one, and building one on frost normals that do not exist
                  would be inventing the data. Until that is done properly, the{" "}
                  <Link
                    href="/tools/planting-calendar/"
                    className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                  >
                    interactive calendar
                  </Link>{" "}
                  will work from dates you supply.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ---------- §5 OTHER STATES ---------- */}
        <section className="pt-14">
          <SectionHead no="§5" title="Other states" />
          <p className="font-serif text-ink/75 mb-4 max-w-2xl">
            Neighbours first. A state line is not a climate boundary, so if you garden near one,
            the state next door is often closer to your conditions than the far end of your own.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              ...d.neighbours.filter(isPageState),
              ...STATE_PAGES.filter((s) => s !== d.slug && !d.neighbours.includes(s)),
            ].map((slug) => (
              <Link
                key={slug}
                href={`/tools/planting-calendar/state/${slug}/`}
                className="font-mono text-[0.7rem] uppercase tracking-wider border-2 border-ink/30 px-3 py-1.5 hover:border-marker hover:text-marker"
              >
                {stateBySlug(slug)?.name ?? slug}
              </Link>
            ))}
          </div>
          <p className="font-serif text-ink/75 mt-5 max-w-2xl">
            Ten states have pages so far, chosen to span the range from Kentucky&apos;s two zones
            to Texas&apos;s seven.{" "}
            <Link
              href="/tools/planting-calendar/state/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              All of them, side by side
            </Link>
            , or work from{" "}
            <Link
              href="/tools/planting-calendar/zone/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              the zone list
            </Link>{" "}
            if you already know yours.
          </p>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 mt-16 pt-5 border-t-2 border-ink/20">
          Zone boundaries PRISM 2023 · frost normals NOAA 1991-2020 by USDA zone ·
          ZIP to state US Census 2020 ZCTA · {d.zipCount.toLocaleString("en-US")} {d.abbr} ZIP codes ·
          station Homesteader Labs
        </p>
      </div>
    </>
  );
}
