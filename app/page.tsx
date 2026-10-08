import AlmanacLine from "@/components/home/AlmanacLine";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import PlantBanner from "@/components/home/PlantBanner";
import { SectionHead, Stamp } from "@/components/field/kit";
import { getBuildsHub, getHubForPost, getLastMeasured, ON_THE_BENCH } from "@/lib/hubs";
import { getAllPosts } from "@/lib/posts";
import { getAllProducts } from "@/lib/products";
import Image from "next/image";
import Link from "next/link";

const description =
  "The logbook of a half acre: what was built, what it cost and what it measured, with printable parts and free planting, weather and resilience tools. No accounts.";

/* The <title> keeps the search wording; the share card says what the site is. */
export const metadata = {
  title: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
  description,
  openGraph: {
    type: "website",
    siteName: "Homesteader Labs",
    title: "One half acre. Every build measured. | Homesteader Labs",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "One half acre. Every build measured. | Homesteader Labs",
    description,
  },
};

/* The homepage is the logbook's current page. People arrive on a guide from
   search and click through to find out who wrote it, so the page answers that:
   one yard, every build measured, and the numbers to prove it. */

const categoryLabel: Record<string, string> = {
  "build-log": "Build log",
  foraging: "Foraging",
  "field-guide": "Field note",
  planting: "Planting",
  growing: "Growing",
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-17" → "17 Sep", read off the string so no timezone can shift it. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MON[m - 1]}`;
}

export default function Home() {
  const posts = getAllPosts();
  const builds = getBuildsHub();
  const latestBuild = builds[builds.length - 1]?.post;
  const measured = getLastMeasured();
  const flagship = getAllProducts()[0];

  let section = 0;
  const no = () => `§${++section}`;

  return (
    <>
      {/* ---------- Logbook band: last entry, and this month's jobs ---------- */}
      <div className="bg-kraft grain border-b-2 border-ink">
        <div className="relative z-[2] max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap justify-between gap-x-6 gap-y-1">
          {posts[0] && (
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-ink/60">
              Logbook · last entry{" "}
              <span className="text-ink font-semibold">{shortDate(posts[0].date)}</span>
            </p>
          )}
          <AlmanacLine builtMonth={new Date().getMonth()} />
        </div>
      </div>

      {/* ---------- Hero ---------- */}
      <section className="max-w-6xl mx-auto px-4 pt-10 md:pt-14 grid md:grid-cols-[1.25fr_0.85fr] gap-10 items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2.5">
            <Stamp color="text-moss">Built here</Stamp>
            <Stamp color="text-slateblue" rotate="1.4deg">Measured</Stamp>
            <Stamp color="text-rust">No account</Stamp>
          </div>
          <h1 className="font-display uppercase text-[2.6rem] sm:text-6xl lg:text-[4.25rem] leading-[0.95] tracking-tight mt-5 text-balance">
            One half acre. <span className="hl">Every build measured.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl italic leading-relaxed max-w-xl">
            Homesteader Labs is the logbook of a working yard: what I built, what it cost, what
            the numbers said, and the parts you can print to build it yourself.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[0.76rem] uppercase tracking-wider">
            {latestBuild && (
              <Link
                href={`/archive/${latestBuild.slug}/`}
                className="bg-ink text-paper px-5 py-3 border-2 border-ink hover:bg-marker hover:border-marker transition-colors"
              >
                Read the latest build →
              </Link>
            )}
            <Link
              href="/builds/"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              All {builds.length} build logs
            </Link>
          </div>
        </div>

        <figure className="min-w-0">
          <div className="relative aspect-[16/10] md:aspect-[5/6] border-2 border-ink shadow-brutalist overflow-hidden bg-kraft">
            <Image
              src="/images/compost-in-hand-earthworm.jpg"
              alt="A handful of dark, crumbly finished compost held in an open palm, with an earthworm across the wrist"
              fill
              sizes="(max-width: 767px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="mt-3 flex items-baseline justify-between gap-3">
            <Link
              href="/archive/mole-earthworms-soil-health/"
              className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-ink/60 hover:text-marker"
            >
              Fig. 1 · Finished compost, from the mole note
            </Link>
            <span className="font-hand text-2xl text-rust -rotate-3 whitespace-nowrap">worm included</span>
          </figcaption>
        </figure>
      </section>

      {/* ---------- Last measured ---------- */}
      {measured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16">
          <SectionHead no={no()} title="Last measured" right="from the build logs" />
          {/* gap-px over an ink/30 ground draws the cell rules at any column count */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/30 border-2 border-ink">
            {measured.map((m) => (
              <Link
                key={`${m.post.slug}-${m.value}`}
                href={`/archive/${m.post.slug}/`}
                className="group grid content-start gap-2 p-4 md:p-5 bg-manila hover:bg-kraft transition-colors"
              >
                <span className="font-display text-4xl md:text-5xl leading-none tracking-tight tabular-nums">
                  {m.value}
                </span>
                <span className="text-[0.98rem] leading-snug">{m.what}</span>
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-ink/60 underline decoration-marker underline-offset-4 group-hover:text-marker">
                  {m.post.stamp ?? m.post.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- On the bench ---------- */}
      {ON_THE_BENCH.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16">
          <SectionHead no={no()} title="On the bench" right="in progress" />
          <div className="grid md:grid-cols-2 gap-4">
            {ON_THE_BENCH.map((item, i) => (
              <div key={item.title} className="border border-dashed border-ink bg-manila/50 p-4 md:p-5 grid gap-2 content-start">
                <Stamp color="text-slateblue" rotate={i % 2 ? "1.2deg" : "-1.5deg"} className="justify-self-start">
                  {item.status}
                </Stamp>
                <h3 className="font-display uppercase text-lg leading-tight">{item.title}</h3>
                <p className="text-[1.02rem] leading-snug">{item.line}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- The planting calendar, sold by its question ---------- */}
      <div className="mt-20">
        <PlantBanner />
      </div>

      {/* ---------- Entries ---------- */}
      <section className="max-w-6xl mx-auto px-4 pt-16">
        <SectionHead
          no={no()}
          title="Entries"
          right={
            <Link href="/archive/" className="hover:text-marker">
              {posts.length} on file · all →
            </Link>
          }
        />
        <ol className="border-t border-ink/30">
          {posts.slice(0, 5).map((post) => {
            const label =
              getHubForPost(post)?.id === "builds" ? "Build log" : categoryLabel[post.category] ?? "Field note";
            return (
              <li key={post.slug} className="border-b border-ink/30">
                <Link
                  href={`/archive/${post.slug}/`}
                  className="group grid grid-cols-[4.5rem_1fr] md:grid-cols-[5rem_7.5rem_1fr_auto] items-baseline gap-x-4 gap-y-1 py-3"
                >
                  <span className="font-mono text-[0.74rem] text-ink/60 tabular-nums">{shortDate(post.date)}</span>
                  <span className="hidden md:inline-block justify-self-start font-mono text-[0.62rem] uppercase tracking-[0.12em] bg-kraft border border-ink/30 px-1.5 py-0.5">
                    {label}
                  </span>
                  <span className="font-semibold text-[1.05rem] leading-snug group-hover:text-marker transition-colors">
                    {post.title}
                  </span>
                  {post.stamp && (
                    <span className="hidden md:inline font-mono text-[0.66rem] uppercase tracking-wider text-slateblue text-right">
                      {post.stamp}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------- From the workshop ---------- */}
      <section className="max-w-6xl mx-auto px-4 pt-16">
        <SectionHead no={no()} title="From the workshop" right="parts and hardware" />
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/tools/fabrication/"
            className="group border-2 border-ink p-5 grid gap-1 content-start hover:bg-kraft transition-colors"
          >
            <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-ink/60">Printable parts</span>
            <span className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors">The parts bin →</span>
            <span className="text-[1.02rem] leading-snug">Open designs from the builds, with the print settings that worked.</span>
          </Link>
          {flagship && (
            <Link
              href={`/shop/${flagship.id.toLowerCase()}/`}
              className="group border-2 border-ink p-5 grid grid-cols-[1fr_auto] gap-4 items-center hover:bg-kraft transition-colors"
            >
              <span className="grid gap-1 min-w-0">
                <span className="font-mono text-[0.64rem] uppercase tracking-[0.14em] text-ink/60">The handheld</span>
                <span className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors">{flagship.name} →</span>
                <span className="text-[1.02rem] leading-snug">Made here and shipped from here.</span>
              </span>
              {flagship.image && (
                <span className="relative block w-20 h-24 border border-ink/40 overflow-hidden">
                  <Image src={flagship.image} alt="" fill sizes="80px" className="object-cover" />
                </span>
              )}
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-16">
        <NewsletterSignup
          kicker="The dispatch"
          heading="Get the next build log"
          blurb="Once a month: every new build from the half acre, what it measured, and what to do outside before the next one."
        />
      </div>
    </>
  );
}
