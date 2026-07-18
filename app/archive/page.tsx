import { getAllPosts, getAllCategories } from "@/lib/posts";
import Link from "next/link";
import { PaperClip, Stamp } from "@/components/field/kit";

export const metadata = {
  title: "Field Notes",
  description: "Field documentation, foraging guides, and survival knowledge from the community.",
};

export default async function ArchivePage(props: { searchParams: Promise<{ tag?: string; drawer?: string }> }) {
  const searchParams = await props.searchParams;
  const allPosts = getAllPosts();
  const categories = getAllCategories();
  // Old ?tag= links from inbound traffic keep filtering; the tab row uses drawers
  const activeDrawer = searchParams.drawer;
  const activeTag = searchParams.tag;
  const posts = activeDrawer
    ? allPosts.filter((post) => post.category === activeDrawer)
    : activeTag
      ? allPosts.filter((post) => post.tags.includes(activeTag))
      : allPosts;

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/" className="hover:text-marker underline underline-offset-4">
              Workbench
            </Link>
            <span>/</span>
            <span>Field Notes</span>
            <span className="ml-auto">{allPosts.length} notes on file</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Tested on a real homestead</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">Prints clean</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] max-w-3xl text-balance">
            Field notes, filed by drawer, not dumped in a pile.
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            Every card shows the season and the subject before you open it.
            Triage in five seconds, read the twenty-minute version later.
          </p>
        </div>
      </section>

      {/* Category drawer tabs */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.72rem] uppercase tracking-wider">
            <Link
              href="/archive/"
              className={`px-3 py-1.5 border-2 border-ink transition-colors ${
                !activeDrawer && !activeTag ? "bg-ink text-paper" : "bg-paper hover:bg-kraft"
              }`}
            >
              All notes
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/archive/?drawer=${encodeURIComponent(cat)}`}
                className={`px-3 py-1.5 border-2 border-ink transition-colors ${
                  activeDrawer === cat ? "bg-ink text-paper" : "bg-paper hover:bg-kraft"
                }`}
              >
                {cat}
              </Link>
            ))}
            {activeTag && (
              <span className="px-3 py-1.5 border-2 border-marker text-marker">
                tag: {activeTag}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Card wall: browsing surface, tilts allowed */}
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/archive/${post.slug}/`}
              className={`relative card-paper grain p-5 pt-6 block hover:-translate-y-1 hover:rotate-0 transition-transform group ${
                i % 3 === 0 ? "rotate-slight" : i % 3 === 1 ? "" : "rotate-slight-r"
              }`}
            >
              <PaperClip className="absolute -top-4 right-8 w-5 h-12 -rotate-6" />
              <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-3 relative z-[2]">
                <span className="bg-kraft px-1.5 py-0.5 border border-ink/40">
                  {post.category || "note"}
                </span>
                <span>{post.date}</span>
              </div>
              <h2 className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {post.title}
              </h2>
              <p className="mt-2 text-[0.95rem] text-ink/80 leading-snug line-clamp-3 relative z-[2]">
                {post.excerpt || post.description}
              </p>
              <p className="mt-4 pt-3 border-t border-dotted border-ink/40 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60 relative z-[2]">
                {post.author} · Read →
              </p>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="card-paper grain p-10 text-center">
            <p className="text-ink/60 italic relative z-[2]">
              Nothing in this drawer yet.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
