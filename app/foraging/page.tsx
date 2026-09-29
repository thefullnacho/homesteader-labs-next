import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp, Tape } from "@/components/field/kit";
import JsonLd from "@/components/JsonLd";
import { getSpecsLine, type Post } from "@/lib/posts";
import { getForagingHub, seriesMonth } from "@/lib/hubs";
import { SITE_URL, siteRef, orgRef, breadcrumbList, pageGraph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Foraging Guides: Wild Berries, Mushrooms, What's in Season",
  description:
    "Every foraging guide on Homesteader Labs in reading order: the wild berry identification guide first, " +
    "then the monthly what-to-forage series, mushroom safety, and tree ID. Lookalikes before meals.",
  alternates: { canonical: "/foraging/" },
};

const linkClass =
  "underline decoration-marker decoration-2 underline-offset-4 hover:text-marker";

/* One row per guide: working list, zero degrees */
function GuideRow({ post, label }: { post: Post; label: string }) {
  return (
    <li className="border-t border-dotted border-ink/30 first:border-t-0">
      <Link href={`/archive/${post.slug}/`} className="group grid sm:grid-cols-[9rem_1fr] gap-x-6 gap-y-1 py-5">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink/55 pt-1">
          {label}
        </span>
        <span>
          <span className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors">
            {post.title}
          </span>
          <span className="block mt-1.5 text-[0.98rem] text-ink/80 leading-snug">
            {post.excerpt || post.description}
          </span>
          <span className="block mt-2 font-mono text-[0.66rem] uppercase tracking-wider text-ink/50">
            {getSpecsLine(post)}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default function ForagingHubPage() {
  const { startHere, series, identification } = getForagingHub();
  const ordered = [...(startHere ? [startHere] : []), ...series, ...identification];

  return (
    <>
      <JsonLd
        data={pageGraph(breadcrumbList([{ name: "Foraging", path: "/foraging/" }]), {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/foraging/`,
          url: `${SITE_URL}/foraging/`,
          name: "Foraging Guides",
          description:
            "Wild berry identification, the monthly what-to-forage series, mushroom safety, and tree ID, in reading order.",
          isPartOf: siteRef,
          publisher: orgRef,
          mainEntity: {
            "@type": "ItemList",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: ordered.length,
            itemListElement: ordered.map((post, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: post.title,
              url: `${SITE_URL}/archive/${post.slug}/`,
            })),
          },
        })}
      />

      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/" className="hover:text-marker underline underline-offset-4">
              Workbench
            </Link>
            <span>/</span>
            <Link href="/archive/" className="hover:text-marker underline underline-offset-4">
              Field Notes
            </Link>
            <span>/</span>
            <span>Foraging</span>
            <span className="ml-auto">{ordered.length} guides on file</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Lookalikes first</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">
              {series.length} monthly {series.length === 1 ? "issue" : "issues"}
            </Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Foraging guides, in the order to read them.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Start with the berries that put people in the ER, then follow the year a month at a
            time. Every guide names the lookalike before it names the meal.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {/* §1 Start here */}
        {startHere && (
          <section className="pt-12">
            <SectionHead no="§1" title="Start here" right="Read first" />
            <Link
              href={`/archive/${startHere.slug}/`}
              className="relative card-paper grain p-6 md:p-8 block max-w-3xl group"
            >
              <Tape className="-top-3 left-10 rotate-[-4deg]" />
              <div className="relative z-[2]">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink/55 mb-3">
                  <span>{startHere.date}</span>
                  {startHere.stamp && <Stamp color="text-moss">{startHere.stamp}</Stamp>}
                </div>
                <h2 className="font-display uppercase text-2xl leading-tight group-hover:text-marker transition-colors">
                  {startHere.title}
                </h2>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-ink/85">
                  {startHere.description}
                </p>
                <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
                  {getSpecsLine(startHere)}
                </p>
              </div>
            </Link>
            <p className="font-hand font-semibold text-marker text-xl mt-5 rotate-[-1deg]">
              ✎ learn the poisonous ones first. The edible list is the easy half.
            </p>
          </section>
        )}

        {/* §2 The monthly series */}
        {series.length > 0 && (
          <section className="pt-14">
            <SectionHead no="§2" title="What to forage, month by month" right="Oldest first" />
            <p className="font-serif text-ink/75 mb-4 max-w-2xl">
              One guide per month, nationwide, with regional callouts for the Northeast, Southeast,
              Midwest and West. Each one covers what is ripe, where it grows, and the mixup that
              peaks that month.
            </p>
            <ol className="card-paper grain px-5 md:px-6 max-w-3xl">
              {series.map((post) => (
                <GuideRow key={post.slug} post={post} label={seriesMonth(post.slug)} />
              ))}
            </ol>
          </section>
        )}

        {/* §3 Identification */}
        {identification.length > 0 && (
          <section className="pt-14">
            <SectionHead no="§3" title="Identification and safety" />
            <ul className="card-paper grain px-5 md:px-6 max-w-3xl">
              {identification.map((post) => (
                <GuideRow key={post.slug} post={post} label={post.tags[0] ?? post.category} />
              ))}
            </ul>
          </section>
        )}

        {/* §4 Practice */}
        <section className="pt-14">
          <SectionHead no="§4" title="Practice before the field" />
          <p className="font-serif text-ink/75 max-w-2xl">
            The{" "}
            <Link href="/tools/forager-game/" className={linkClass}>
              field quiz
            </Link>{" "}
            puts a real iNaturalist photo in front of you and the model, with the documented
            lookalikes as the wrong answers. The offline forager that refuses when it is unsure has
            its own write-up in the{" "}
            <Link href="/builds/" className={linkClass}>
              build logs
            </Link>
            .
          </p>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 pt-16">
          Foraging hub · {ordered.length} guides · Educational purposes only. Field-verify before
          you eat anything.
        </p>
      </div>
    </>
  );
}
