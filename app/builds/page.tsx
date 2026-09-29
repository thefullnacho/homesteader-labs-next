import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";
import JsonLd from "@/components/JsonLd";
import { getBuildsHub } from "@/lib/hubs";
import { SITE_URL, siteRef, orgRef, breadcrumbList, pageGraph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Build Logs: Tools, Models and Homestead Systems",
  description:
    "Every Homesteader Labs build log in order, from the weather and planting tools to an offline forager model, " +
    "a local house assistant and a drip irrigation system, each with what actually came out of it.",
  alternates: { canonical: "/builds/" },
};

/* Status stamp colors: moss for things that work, rust for the loss */
const statusColor: Record<string, string> = {
  Shipped: "text-moss",
  Running: "text-moss",
  Working: "text-moss",
  Lost: "text-rust",
};

export default function BuildsHubPage() {
  const builds = getBuildsHub();
  const first = builds[0]?.post.date;
  const latest = builds[builds.length - 1]?.post.date;

  return (
    <>
      <JsonLd
        data={pageGraph(breadcrumbList([{ name: "Builds", path: "/builds/" }]), {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/builds/`,
          url: `${SITE_URL}/builds/`,
          name: "Build Logs",
          description:
            "Every build log in chronological order, each with a one-line outcome.",
          isPartOf: siteRef,
          publisher: orgRef,
          mainEntity: {
            "@type": "ItemList",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: builds.length,
            itemListElement: builds.map(({ post }, i) => ({
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
            <span>Builds</span>
            <span className="ml-auto">
              {builds.length} builds · {first} to {latest}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Outcome first</Stamp>
            <Stamp color="text-rust" rotate="1.6deg">Losses included</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Build logs, in the order they happened.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            The tools on this site, the models behind the forager, and the systems running in our
            own house and yard. Each entry says how it turned out before you open it.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <section className="pt-12">
          <SectionHead no="§1" title="The log" right="Oldest first" />
          <ol className="card-paper grain px-5 md:px-6 max-w-3xl">
            {builds.map(({ post, outcome }, i) => (
              <li
                key={post.slug}
                className="relative z-[2] grid sm:grid-cols-[7.5rem_1fr] gap-x-6 gap-y-1 py-5 border-t border-dotted border-ink/30 first:border-t-0"
              >
                <div className="flex sm:flex-col items-center sm:items-start gap-x-3 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink/55 pt-1">
                  <span>No. {String(i + 1).padStart(2, "0")}</span>
                  <span>{post.date}</span>
                  {outcome && (
                    <Stamp color={statusColor[outcome.status] ?? "text-slateblue"} className="ml-auto sm:ml-0">
                      {outcome.status}
                    </Stamp>
                  )}
                </div>
                <div>
                  <Link
                    href={`/archive/${post.slug}/`}
                    className="font-display uppercase text-lg leading-tight hover:text-marker transition-colors"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1.5 text-[0.98rem] text-ink/80 leading-snug">
                    {outcome?.line ?? post.description}
                  </p>
                  {outcome?.tool && (
                    <Link
                      href={outcome.tool.href}
                      className="inline-block mt-2 font-mono text-[0.68rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
                    >
                      Use it: {outcome.tool.label} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 pt-16">
          Builds hub · {builds.length} logs · The forager models are open weights, Apache-2.0.
        </p>
      </div>
    </>
  );
}
