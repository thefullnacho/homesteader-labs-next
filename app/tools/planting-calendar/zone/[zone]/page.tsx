import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead, Stamp } from "@/components/field/kit";
import {
  ZONE_PAGES,
  getZonePageData,
  isPageZone,
  FALL_FACTOR_DAYS,
  type PageZone,
} from "@/lib/tools/planting-calendar/zonePages";

// Static at build time: the schedule is a pure function of the zone's frost
// normals, so there is nothing to compute per request.
export const dynamic = "force-static";

export function generateStaticParams() {
  return ZONE_PAGES.map((zone) => ({ zone }));
}

type Props = { params: Promise<{ zone: string }> };

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
const fmtShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const ACTION_LABEL: Record<string, string> = {
  "start-indoors": "Start indoors",
  transplant: "Transplant",
  "direct-sow": "Direct sow",
  harvest: "Harvest",
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { zone } = await props.params;
  if (!isPageZone(zone)) return { title: "Zone not found" };

  const d = getZonePageData(zone as PageZone);
  return {
    title: `Zone ${zone} Planting Calendar: Frost Dates and Sowing Schedule`,
    description:
      `Zone ${zone} frost dates, last spring frost ${fmt(d.lastSpringFrost)} and first fall ` +
      `frost ${fmt(d.firstFallFrost)}, a ${d.frostFreeDays}-day season. Sowing dates for ` +
      `${d.rows.length} vegetables, ranked with calories per plant.`,
    alternates: { canonical: `/tools/planting-calendar/zone/${zone}/` },
  };
}

export default async function ZonePage(props: Props) {
  const { zone } = await props.params;
  if (!isPageZone(zone)) notFound();

  const d = getZonePageData(zone as PageZone);
  const fall = d.fallSowing();
  const spring = d.rows.filter((r) => !r.overwinters);
  const overwinter = d.rows.filter((r) => r.overwinters);

  return (
    <>
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
              {" / "}Zone {zone}
            </span>
            <span className="text-right shrink-0">{d.frostFreeDays} frost-free days</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Stamp>Zone {zone}</Stamp>
            <Stamp>NOAA 1991-2020</Stamp>
          </div>

          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Zone {zone} Planting Calendar
          </h1>
          <p className="font-serif italic text-lg text-ink/75 mt-4 max-w-2xl">
            Last frost {fmt(d.lastSpringFrost)}, first frost {fmt(d.firstFallFrost)}, give or take{" "}
            {d.frostVarianceDays} days. Everything below is counted from those two dates.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* ---------- §1 THE TWO DATES ---------- */}
        <section className="pt-12">
          <SectionHead no="§1" title="The two dates everything hangs on" />
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              ["Last spring frost", fmt(d.lastSpringFrost), `±${d.frostVarianceDays} days`],
              ["First fall frost", fmt(d.firstFallFrost), `±${d.frostVarianceDays} days`],
              ["Growing season", `${d.frostFreeDays} days`, "between the two"],
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
          <p className="font-serif text-ink/75 mt-5 max-w-2xl">
            These are NOAA 1991-2020 normals for the zone, not for your yard. A normal is a
            midpoint: half of years frost later than this. Treat the variance as the real number
            and hold transplants back if the forecast argues.
          </p>

          <div className="card-paper grain p-5 mt-6">
            <div className="relative z-[2]">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-marker mb-2">
                {d.constraint.headline}
              </div>
              <p className="font-serif text-ink/85 max-w-2xl">{d.constraint.body}</p>
            </div>
          </div>
        </section>

        {/* ---------- §2 STILL SOWABLE (the time-sensitive one, kept high) ---------- */}
        <section className="pt-14">
          <SectionHead
            no="§2"
            title="What you can still sow"
            right={<span className="font-mono text-[0.64rem]">{fall.length} crops left</span>}
          />
          {fall.length === 0 ? (
            <p className="font-serif text-ink/75 max-w-2xl">
              Nothing. Every cool-season crop in the database now needs more days than zone {zone}
              has left before {fmt(d.firstFallFrost)}. That is the honest answer: the sowing season
              has closed here, and the next window opens in spring.
            </p>
          ) : (
            <>
              <p className="font-serif text-ink/75 mb-5 max-w-2xl">
                Counted back from first frost, with {FALL_FACTOR_DAYS} days added to each crop&apos;s
                maturity because autumn growth is slower than the summer days those figures were
                measured in. Sow by the date shown or it does not finish.
              </p>
              <div className="card-paper grain overflow-hidden">
                <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
                  <table className="w-full font-mono text-[0.76rem] min-w-[520px]">
                    <thead>
                      <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                        <th className="py-1.5 pr-3 font-semibold">Sow by</th>
                        <th className="py-1.5 pr-3 font-semibold">Crop</th>
                        <th className="py-1.5 pr-3 font-semibold text-right">Days</th>
                        <th className="py-1.5 pr-3 font-semibold text-right">Cal/plant</th>
                        <th className="py-1.5 font-semibold text-right">Stores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fall.map((r) => (
                        <tr key={r.cropId} className="h-[34px] border-t border-dotted border-ink/20">
                          <td className="py-1.5 pr-3 text-marker">{fmtShort(r.sowBy)}</td>
                          <td className="py-1.5 pr-3">{r.cropName}</td>
                          <td className="py-1.5 pr-3 text-right text-ink/60">{r.adjustedDays}</td>
                          <td className="py-1.5 pr-3 text-right">{r.caloriesPerPlant ?? "—"}</td>
                          <td className="py-1.5 text-right text-ink/60">
                            {r.storageLifeDays ? `${r.storageLifeDays}d` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="font-serif text-ink/75 mt-5 max-w-2xl">
                Warm-season crops are left out on purpose. A tomato sown now &quot;finishes&quot; on
                paper, but fruit set collapses as nights cool, so the arithmetic lies. The crops
                above sweeten after frost instead. See{" "}
                <Link href="/archive/fall-garden-plan/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
                  the fall garden note
                </Link>{" "}
                for why storage matters more than calories here.
              </p>
            </>
          )}
        </section>

        {/* ---------- §3 THE FULL SPRING SCHEDULE ---------- */}
        <section className="pt-14">
          <SectionHead
            no="§3"
            title="The spring schedule"
            right={<span className="font-mono text-[0.64rem]">{spring.length} crops</span>}
          />
          <div className="card-paper grain overflow-hidden">
            <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
              <table className="w-full font-mono text-[0.76rem] min-w-[560px]">
                <thead>
                  <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                    <th className="py-1.5 pr-3 font-semibold">Start</th>
                    <th className="py-1.5 pr-3 font-semibold">Crop</th>
                    <th className="py-1.5 pr-3 font-semibold">Action</th>
                    <th className="py-1.5 pr-3 font-semibold">Harvest</th>
                    <th className="py-1.5 font-semibold text-right">Cal/plant</th>
                  </tr>
                </thead>
                <tbody>
                  {spring.map((r) => (
                    <tr key={r.cropId} className="h-[34px] border-t border-dotted border-ink/20">
                      <td className="py-1.5 pr-3 text-marker">{fmtShort(r.startDate)}</td>
                      <td className="py-1.5 pr-3">{r.cropName}</td>
                      <td className="py-1.5 pr-3 text-ink/60">{ACTION_LABEL[r.startAction]}</td>
                      <td className="py-1.5 pr-3 text-ink/60">
                        {r.harvestDate ? fmtShort(r.harvestDate) : "—"}
                      </td>
                      <td className="py-1.5 text-right">{r.caloriesPerPlant ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {overwinter.length > 0 && (
            <p className="font-serif text-ink/75 mt-5 max-w-2xl">
              Sown the previous autumn to overwinter, so they sit outside this season&apos;s
              schedule: {overwinter.map((r) => r.cropName).join(", ")}. In zone {zone} that means
              putting them in around {fmtShort(overwinter[0].startDate)} of the year before.
            </p>
          )}
        </section>

        {/* ---------- §4 OTHER ZONES ---------- */}
        <section className="pt-14">
          <SectionHead no="§4" title="Other zones" />
          <p className="font-serif text-ink/75 mb-4 max-w-2xl">
            Not sure which is yours? The{" "}
            <Link href="/tools/planting-calendar/" className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker">
              planting calendar
            </Link>{" "}
            resolves it from your ZIP against the USDA 2023 map, rather than asking you to read a
            colour off a picture.
          </p>
          <div className="flex flex-wrap gap-2">
            {ZONE_PAGES.map((z) => (
              <Link
                key={z}
                href={`/tools/planting-calendar/zone/${z}/`}
                className={`font-mono text-[0.7rem] uppercase tracking-wider border-2 px-3 py-1.5 ${
                  z === zone
                    ? "border-marker text-marker"
                    : "border-ink/30 hover:border-marker hover:text-marker"
                }`}
              >
                Zone {z}
              </Link>
            ))}
          </div>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 mt-16 pt-5 border-t-2 border-ink/20">
          Frost normals NOAA 1991-2020 by USDA zone · zone boundaries PRISM 2023 ·
          crop data content/crops · station Homesteader Labs
        </p>
      </div>
    </>
  );
}
