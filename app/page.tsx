import NewsletterSignup from "@/components/home/NewsletterSignup";
import { getAllPosts } from "@/lib/posts";
import { getAllProducts } from "@/lib/products";
import { CoffeeRing, PaperClip, SectionHead, Stamp, Tape } from "@/components/field/kit";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
  description: "Free tools for self-reliant homesteaders: frost & weather risk, zone-calibrated planting calendars, caloric-security planning, 3D-printable fabrication, plus field-tested off-grid hardware.",
};

const tools = [
  {
    no: "01",
    name: "Weather Station",
    job: "Can you do the thing today?",
    need: "ZIP code",
    href: "/tools/weather/",
    rows: ["Frost risk, called daily", "Soil workability verdicts", "Growing degree days"],
    stamps: [["Free", "text-moss"], ["No account", "text-slateblue"]],
  },
  {
    no: "02",
    name: "Planting Calendar",
    job: "Your frost dates, then every date after.",
    need: "ZIP code",
    href: "/tools/planting-calendar/",
    rows: ["54 crops, zone-calibrated", "Succession logic built in", "Season extension options"],
    stamps: [["Free", "text-moss"], ["Prints clean", "text-slateblue"]],
  },
  {
    no: "03",
    name: "Resilience Dashboard",
    job: "How many days can you feed yourself?",
    need: "Pantry list",
    href: "/tools/caloric-security/",
    rows: ["Food, water, and power clocks", "Household draw, computed", "The shortest clock wins"],
    stamps: [["Free", "text-moss"], ["Private by default", "text-slateblue"]],
  },
  {
    no: "04",
    name: "Workshop",
    job: "Printable parts that earn their place outside.",
    need: "A printer",
    href: "/tools/fabrication/",
    rows: ["Field-tested part designs", "Honest print settings", "Free models first"],
    stamps: [["Free", "text-moss"], ["Open designs", "text-slateblue"]],
  },
];

export default function Home() {
  const posts = getAllPosts();
  const latest = posts[0];
  const noteTrio = posts.slice(0, 3);
  const flagship = getAllProducts()[0];

  return (
    <>
      {/* Full-bleed hero image */}
      <div className="w-full h-[40vh] overflow-hidden border-b-2 border-ink">
        <Image
          src="/images/seedlings_sprouting.png"
          alt="Seedlings sprouting in a garden"
          width={1600}
          height={900}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* ---------- HERO: the workbench ---------- */}
      <section className="bg-paper grain border-b-2 border-ink relative overflow-hidden">
        <CoffeeRing className="absolute w-40 h-40 right-[8%] top-10 hidden lg:block opacity-70" />
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-16 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start relative z-[2]">
          <div>
            <div className="flex flex-wrap gap-2 mb-6">
              <Stamp color="text-rust">No account</Stamp>
              <Stamp color="text-moss" rotate="1.6deg">Free tools</Stamp>
              <Stamp color="text-slateblue" rotate="-2.4deg">No tracking</Stamp>
            </div>
            <h1 className="font-display uppercase leading-[0.95] text-4xl sm:text-5xl md:text-6xl text-balance">
              Tools for people who{" "}
              <span className="hl">build their own world.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-xl leading-relaxed text-ink/85">
              Weather you can act on. Planting dates from <em>your</em> frost
              line. Field notes you can read with dirt on your hands. Know your
              weather, plan your season, track your resilience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 font-mono text-[0.78rem] uppercase tracking-wider">
              <Link
                href="/tools/"
                className="bg-ink text-paper px-5 py-3 border-2 border-ink hover:bg-marker hover:border-marker transition-colors"
              >
                Open the toolkit →
              </Link>
              <Link
                href="/shop/"
                className="px-5 py-3 border-2 border-ink bg-paper hover:bg-kraft transition-colors"
              >
                Browse hardware
              </Link>
            </div>
          </div>

          {/* Pinned latest note */}
          {latest && (
            <div className="relative lg:mt-4">
              <div className="relative rotate-slight-r card-paper grain p-5 max-w-sm mx-auto">
                <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-3deg]" />
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2 relative z-[2]">
                  Latest note · {latest.date}
                </p>
                <p className="font-display uppercase text-xl leading-tight relative z-[2]">
                  {latest.title}
                </p>
                <p className="mt-2 text-[0.95rem] text-ink/80 leading-snug line-clamp-3 relative z-[2]">
                  {latest.excerpt || latest.description}
                </p>
                <div className="mt-4 flex items-center justify-between relative z-[2]">
                  <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 bg-kraft px-1.5 py-0.5 border border-ink/40">
                    {latest.category || "note"}
                  </span>
                  <Link
                    href={`/archive/${latest.slug}/`}
                    className="font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---------- TOOLKIT ---------- */}
      <section id="toolkit" className="max-w-6xl mx-auto px-4 pt-16">
        <SectionHead no="§1" title="The Toolkit" right="4 tools · 0 logins · $0" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {tools.map((t, i) => (
            <Link
              key={t.no}
              href={t.href}
              className={`card-paper grain p-5 flex flex-col group ${
                i % 2 ? "rotate-slight-r" : "rotate-slight"
              } hover:rotate-0 transition-transform`}
            >
              <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 relative z-[2]">
                <span className="font-mono text-[0.7rem] font-bold text-marker">
                  No. {t.no}
                </span>
                <span className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/50">
                  You need: {t.need}
                </span>
              </div>
              <h3 className="font-display uppercase text-lg mt-3 leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {t.name}
              </h3>
              <p className="text-[0.95rem] text-ink/80 mt-1 mb-4 relative z-[2]">{t.job}</p>
              <div className="bg-paper/70 border border-ink/30 p-3 mb-4 space-y-1.5 font-mono text-[0.72rem] uppercase tracking-wide relative z-[2]">
                {t.rows.map((row) => (
                  <div
                    key={row}
                    className="border-b border-dotted border-ink/40 pb-1 last:border-b-0 last:pb-0"
                  >
                    {row}
                  </div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 relative z-[2]">
                <div className="flex gap-1.5 flex-wrap">
                  {t.stamps.map(([s, color], j) => (
                    <Stamp key={s} color={color} rotate={j === 0 ? "-2deg" : "1.4deg"}>
                      {s}
                    </Stamp>
                  ))}
                </div>
                <span className="font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 whitespace-nowrap">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- FIELD NOTES ---------- */}
      <section className="max-w-6xl mx-auto px-4 pt-20">
        <SectionHead
          no="§2"
          title="Field Notes"
          right={
            <Link href="/archive/" className="hover:text-marker">
              {posts.length} notes on file · browse all →
            </Link>
          }
        />
        <div className="grid md:grid-cols-3 gap-6">
          {noteTrio.map((n) => (
            <Link
              key={n.slug}
              href={`/archive/${n.slug}/`}
              className="relative card-paper grain p-5 pt-6 block hover:-translate-y-1 transition-transform group"
            >
              <PaperClip className="absolute -top-4 right-8 w-5 h-12 -rotate-6" />
              <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-3 relative z-[2]">
                <span className="bg-kraft px-1.5 py-0.5 border border-ink/40">
                  {n.category || "note"}
                </span>
                <span>{n.date}</span>
              </div>
              <h3 className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {n.title}
              </h3>
              <p className="mt-2 text-[0.95rem] text-ink/80 leading-snug line-clamp-3 relative z-[2]">
                {n.excerpt || n.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- HARDWARE: the flagship ---------- */}
      {flagship && (
        <section className="max-w-6xl mx-auto px-4 pt-20">
          <SectionHead
            no="§3"
            title="Hardware"
            right={
              <Link href="/shop/" className="hover:text-marker">
                full catalog →
              </Link>
            }
          />
          <div className="border-2 border-ink bg-kraft grain relative">
            <div className="grid md:grid-cols-[1.2fr_1fr] relative z-[2]">
              {flagship.image && (
                <div className="relative min-h-[260px] border-b-2 md:border-b-0 md:border-r-2 border-ink overflow-hidden">
                  <Image
                    src={flagship.image}
                    alt={flagship.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-display uppercase text-2xl leading-tight">
                    {flagship.name}
                  </h3>
                  <Stamp color="text-rust" rotate="2deg">
                    {typeof flagship.stock === "string" ? flagship.stock : "In stock"}
                  </Stamp>
                </div>
                <p className="text-[0.98rem] text-ink/85 leading-snug mb-4">
                  {flagship.description}
                </p>
                {flagship.features && (
                  <ul className="space-y-1.5 font-mono text-[0.72rem] uppercase tracking-wide text-ink/75 mb-6">
                    {flagship.features.slice(0, 3).map((f) => (
                      <li key={f} className="border-b border-dotted border-ink/40 pb-1 last:border-b-0">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-3xl">${flagship.price}</span>
                  <Link
                    href={`/shop/${flagship.id.toLowerCase()}/`}
                    className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
                  >
                    See the spec sheet →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- DISPATCH + MISSION ---------- */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-8">
        <NewsletterSignup />

        <section className="mb-4">
          <div className="border-2 border-ink bg-kraft grain p-8 md:p-10 relative">
            <Tape className="-top-3 left-10 rotate-[-4deg]" />
            <Tape className="-top-3 right-10 rotate-[3deg]" />
            <div className="grid md:grid-cols-[1fr_2fr] gap-6 items-baseline relative z-[2]">
              <h2 className="font-display uppercase text-2xl leading-tight">
                The house rules
              </h2>
              <div className="space-y-3 text-[1.05rem] leading-relaxed text-ink/90">
                <p>
                  <strong className="font-bold">1. Hardware.</strong> Tools and
                  devices designed for off-grid resilience, from LoRa mesh nodes
                  to field identification you can hold.
                </p>
                <p>
                  <strong className="font-bold">2. Knowledge.</strong> Field-tested
                  documentation on foraging, fabrication, and survival skills.
                  Written by people who live it.
                </p>
                <p>
                  <strong className="font-bold">3. Community.</strong> Open designs
                  and shared knowledge. Builders helping builders navigate the
                  gray zones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Terminal hint kept for the ALT+T easter egg */}
        <section className="sr-only">
          <p className="font-mono">
            [<kbd>ALT</kbd>+<kbd>T</kbd>] ACCESS TERMINAL
          </p>
        </section>
      </div>
    </>
  );
}
