import { getAllPosts, getAllCategories, getPostNo, getSpecsLine } from "@/lib/posts";
import Link from "next/link";
import { PaperClip, Stamp, Tape } from "@/components/field/kit";

export const metadata = {
  title: "Field Notes",
  description: "Field documentation, foraging guides, and survival knowledge from the community.",
};

/* One-line blurb per drawer, shown next to the pulls */
const drawerBlurbs: Record<string, string> = {
  "build-log": "How the tools get built",
  "field-guide": "Tried outside, written down",
  foraging: "Wild food, identified whole",
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

      {/* Drawer pulls */}
      <section className="max-w-6xl mx-auto px-4 pt-10">
        <div
          className="flex flex-wrap items-end gap-2 border-b-2 border-ink pb-0"
          role="tablist"
          aria-label="Filter notes by drawer"
        >
          {["", ...categories].map((cat) => {
            const active = cat === "" ? !activeDrawer && !activeTag : activeDrawer === cat;
            const count = cat === "" ? allPosts.length : allPosts.filter((p) => p.category === cat).length;
            return (
              <Link
                key={cat || "all"}
                href={cat === "" ? "/archive/" : `/archive/?drawer=${encodeURIComponent(cat)}`}
                role="tab"
                aria-selected={active}
                className={`font-mono text-[0.72rem] uppercase tracking-wider px-5 pt-2 pb-2.5 border-2 border-b-0 border-ink transition-colors ${
                  active ? "bg-ink text-paper" : "bg-manila hover:bg-kraft text-ink"
                }`}
                style={{
                  clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)",
                  marginBottom: "-2px",
                }}
              >
                {cat === "" ? "All notes" : cat}{" "}
                <span className={active ? "text-marker" : "text-ink/45"}>{count}</span>
              </Link>
            );
          })}
          {activeTag && (
            <span className="font-mono text-[0.72rem] uppercase tracking-wider px-3 py-1.5 mb-1 border-2 border-marker text-marker">
              tag: {activeTag}
            </span>
          )}
          <span className="ml-auto hidden md:block font-mono text-[0.66rem] uppercase tracking-widest text-ink/50 pb-2">
            {(activeDrawer && drawerBlurbs[activeDrawer]) || "The whole card catalog"}
          </span>
        </div>

        {/* Card wall: browsing surface, tilts allowed */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/archive/${post.slug}/`}
              className={`relative card-paper grain p-5 pt-6 flex flex-col hover:-translate-y-1 hover:rotate-0 transition-transform group ${
                i % 3 === 0 ? "rotate-slight" : i % 3 === 1 ? "" : "rotate-slight-r"
              }`}
            >
              <PaperClip className="absolute -top-4 right-8 w-5 h-12 -rotate-6" />
              <div className="flex items-center justify-between font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 mb-3 relative z-[2]">
                <span className="bg-kraft px-1.5 py-0.5 border border-ink/40">
                  {post.category || "note"}
                </span>
                <span>No. {getPostNo(post.slug)} · {post.date}</span>
              </div>
              <h2 className="font-display uppercase text-lg leading-tight group-hover:text-marker transition-colors relative z-[2]">
                {post.title}
              </h2>
              <p className="mt-2 text-[0.95rem] text-ink/80 leading-snug line-clamp-3 flex-1 relative z-[2]">
                {post.excerpt || post.description}
              </p>
              <div className="mt-4 pt-3 border-t border-dotted border-ink/40 flex items-center justify-between gap-2 relative z-[2]">
                <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
                  {getSpecsLine(post)}
                </span>
                {post.stamp && (
                  <Stamp color="text-moss" rotate="-1.6deg">{post.stamp}</Stamp>
                )}
              </div>
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

        {/* How these notes work */}
        <div className="mt-14 mb-16 border-2 border-ink bg-kraft grain p-6 md:p-8 relative max-w-3xl">
          <Tape className="-top-3 left-10 rotate-[-4deg]" />
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2 relative z-[2]">
            How these notes work
          </p>
          <p className="text-[1.05rem] leading-relaxed text-ink/90 relative z-[2]">
            Every note opens with an <strong className="font-bold">at-a-glance card</strong>:{" "}
            season, skill, time, region, gear. If the card answers your question,
            close the tab and go outside. If it doesn&apos;t, the long version is
            written to be read <span className="hl">standing up, with gloves on.</span>
          </p>
          <p className="font-hand font-semibold text-marker text-xl mt-4 rotate-[-1deg] relative z-[2]">
            ✎ print any note, it fits on one page, both sides.
          </p>
        </div>
      </section>
    </>
  );
}
