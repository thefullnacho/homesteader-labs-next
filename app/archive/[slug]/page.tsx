import { getAllSlugs, getPostBySlug, getAllPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PaperClip, Stamp } from "@/components/field/kit";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { slug } = params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Document Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function ArchivePostPage(props: PageProps) {
  const params = await props.params;
  const { slug } = params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Dynamically import the MDX content
  const { default: MDXContent } = await import(`../../../content/archive/${slug}.mdx`);

  // Two neighbors from the same drawer for the footer
  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) =>
      a.category === post.category && b.category !== post.category ? -1 : 1
    )
    .slice(0, 2);

  return (
    <article>
      {/* Note header band */}
      <section className="bg-kraft grain border-b-2 border-ink torn-top relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/archive/" className="hover:text-marker underline underline-offset-4">
              Field Notes
            </Link>
            <span>/</span>
            <span className="bg-paper border border-ink/40 px-1.5 py-0.5">{post.category}</span>
            <span className="ml-auto">
              {post.date} · {post.author}
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {post.tags.slice(0, 3).map((tag, i) => (
                <Stamp
                  key={tag}
                  color={i === 0 ? "text-moss" : i === 1 ? "text-slateblue" : "text-rust"}
                  rotate={i === 1 ? "1.8deg" : i === 2 ? "-2.2deg" : undefined}
                >
                  {tag}
                </Stamp>
              ))}
            </div>
          )}
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            {post.title}
          </h1>
          <p className="mt-5 text-xl md:text-2xl leading-relaxed max-w-2xl text-ink/85 italic">
            {post.description}
          </p>
        </div>
      </section>

      {/* Body: working surface, zero degrees */}
      <section className="max-w-3xl mx-auto px-4 pt-12">
        <div className="relative">
          <MDXContent />
        </div>

        {/* Document footer */}
        <div className="mt-12 border-t-2 border-ink pt-4 flex flex-col sm:flex-row justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
          <div>
            <p>Document: {post.slug.replace(/-/g, "_")}</p>
            <p>Operator: {post.author}</p>
          </div>
          <p className="text-ink/50 max-w-xs sm:text-right">
            Educational purposes only. Field-verify before you rely on it.
          </p>
        </div>

        {/* Filed next to this one: browsing cards, tilts allowed */}
        {related.length > 0 && (
          <div className="mt-16 pb-16 no-print">
            <div className="flex items-end justify-between border-b-2 border-ink pb-2 mb-6">
              <h2 className="font-display uppercase text-xl">Filed next to this one</h2>
              <Link
                href="/archive/"
                className="font-mono text-[0.7rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
              >
                ← All field notes
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
              {related.map((n, i) => (
                <Link
                  key={n.slug}
                  href={`/archive/${n.slug}/`}
                  className={`relative card-paper grain p-5 pt-6 block hover:-translate-y-1 transition-transform group ${
                    i % 2 ? "rotate-slight-r" : "rotate-slight"
                  }`}
                >
                  <PaperClip className="absolute -top-4 right-8 w-5 h-12 -rotate-6" />
                  <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-2 relative z-[2]">
                    <span className="bg-kraft px-1.5 py-0.5 border border-ink/40">
                      {n.category}
                    </span>
                    <span>{n.date}</span>
                  </div>
                  <h3 className="font-display uppercase text-base leading-tight group-hover:text-marker transition-colors relative z-[2]">
                    {n.title}
                  </h3>
                  <p className="mt-1.5 text-[0.92rem] text-ink/80 line-clamp-2 relative z-[2]">
                    {n.excerpt || n.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
