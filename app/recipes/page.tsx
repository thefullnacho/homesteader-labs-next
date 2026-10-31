import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";
import JsonLd from "@/components/JsonLd";
import { getSpecsLine } from "@/lib/posts";
import { getRecipesHub } from "@/lib/hubs";
import { getImageSize } from "@/lib/imageSize";
import { SITE_URL, siteRef, orgRef, breadcrumbList, pageGraph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Recipes From the Yard: What We Cooked From the Half Acre",
  description:
    "Recipes made from what grew here, each with a card you can save or print: nasturtium pesto, " +
    "poor man's capers, stuffed flowers, and whatever the next harvest brings.",
  alternates: { canonical: "/recipes/" },
};

export default function RecipesHubPage() {
  const entries = getRecipesHub();
  const cardCount = entries.reduce((n, e) => n + e.cards.length, 0);

  return (
    <>
      <JsonLd
        data={pageGraph(breadcrumbList([{ name: "Recipes", path: "/recipes/" }]), {
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/recipes/`,
          url: `${SITE_URL}/recipes/`,
          name: "Recipes From the Yard",
          description: "Recipes made from what grew on the half acre, newest first, each with a saveable card.",
          isPartOf: siteRef,
          publisher: orgRef,
          mainEntity: {
            "@type": "ItemList",
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            numberOfItems: entries.length,
            itemListElement: entries.map(({ post }, i) => ({
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
            <span>Recipes</span>
            <span className="ml-auto">
              {cardCount} {cardCount === 1 ? "card" : "cards"} on file
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">From the yard</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Recipes from the yard.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            What grew here, and what we made of it the same week. Every recipe has a card you can save
            to your phone or print for the kitchen.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        {entries.map(({ post, cards }, i) => (
          <section key={post.slug} className="pt-12">
            <SectionHead no={`§${i + 1}`} title={post.title} right={post.date} />
            <p className="font-serif text-ink/80 max-w-2xl">{post.excerpt || post.description}</p>
            <p className="mt-2 font-mono text-[0.66rem] uppercase tracking-wider text-ink/50">
              {getSpecsLine(post)}
            </p>

            {cards.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {cards.map((card) => {
                  const size = getImageSize(card.src);
                  return (
                    <li key={card.src}>
                      <a href={card.src} className="block card-paper p-1.5 hover:-translate-y-0.5 transition-transform">
                        {/* Plain img for the same reason as the MDX renderer: the real /images/ path, real dimensions. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.src}
                          alt={card.alt}
                          width={size?.width}
                          height={size?.height}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-auto block"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-wider">
              <Link
                href={`/archive/${post.slug}/`}
                className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
              >
                Read the full note
              </Link>
            </p>
          </section>
        ))}

        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink/45 pt-16">
          Recipes hub · {entries.length} {entries.length === 1 ? "note" : "notes"} · Never eat
          anything that was sprayed, and know what you picked before you cook it.
        </p>
      </div>
    </>
  );
}
