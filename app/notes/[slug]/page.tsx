import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { getAllNotes, getNote } from "@/lib/notes";
import { getPostBySlug } from "@/lib/posts";
import { breadcrumbList, pageGraph, SITE_URL } from "@/lib/schema";

/* Lab notes: the numbers and sources behind a story, for readers who want to
   check them and agents who will cite them. A working surface: no tilts, no
   tape, zero degrees. */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllNotes().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const note = getNote(slug);
  if (!note) return {};
  return {
    title: `Lab notes: ${note.title}`,
    description: note.summary,
    alternates: { canonical: `/notes/${slug}/` },
  };
}

export default async function LabNotePage(props: PageProps) {
  const { slug } = await props.params;
  const note = getNote(slug);
  if (!note) notFound();
  const story = getPostBySlug(note.story);
  if (!story) throw new Error(`lab notes ${slug} name a story that does not exist: ${note.story}`);

  const { default: NoteContent } = await import(`../../../content/notes/${slug}.mdx`);

  return (
    <article>
      <JsonLd
        data={pageGraph(
          breadcrumbList([
            { name: "Field Notes", path: "/archive/" },
            { name: story.title, path: `/archive/${story.slug}/` },
            { name: "Lab notes", path: `/notes/${slug}/` },
          ])
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: note.title,
            description: note.summary,
            datePublished: story.date,
            author: { "@type": "Person", name: story.author },
            isBasedOn: note.repo,
            isPartOf: { "@type": "Article", "@id": `${SITE_URL}/archive/${story.slug}/` },
            mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/notes/${slug}/` },
          }),
        }}
      />

      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/archive/" className="hover:text-marker underline underline-offset-4">
              Field Notes
            </Link>
            <span>/</span>
            <span className="bg-paper border border-ink/40 px-1.5 py-0.5">Lab notes</span>
            <span className="ml-auto">Work dated {note.date}</span>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-4xl leading-[1.02] max-w-4xl text-balance">
            {note.title}
          </h1>
          <p className="mt-5 text-lg md:text-xl leading-relaxed max-w-3xl text-ink/85 italic">{note.summary}</p>
          <p className="mt-6 font-mono text-[0.75rem] uppercase tracking-wider">
            The story:{" "}
            <Link
              href={`/archive/${story.slug}/`}
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
            >
              {story.title}
            </Link>
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pt-12 pb-16">
        <div className="lab-notes [&_table]:w-full [&_table]:text-sm [&_table]:font-mono [&_table]:mb-6 [&_th]:text-left [&_th]:border-b-2 [&_th]:border-ink [&_th]:py-2 [&_th]:pr-3 [&_td]:border-b [&_td]:border-ink/20 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top overflow-x-auto">
          <NoteContent />
        </div>

        <div className="mt-12 border-t-2 border-ink pt-4 flex flex-col sm:flex-row justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-wider text-ink/60">
          <div>
            <p>Lab notes: {slug.replace(/-/g, "_")}</p>
            {note.commit && <p>Repo links pinned to {note.commit.slice(0, 7)}</p>}
          </div>
          <p className="text-ink/50 max-w-xs sm:text-right">
            Measured means on the bench, with its file. Estimated says what it adds up.
          </p>
        </div>
      </section>
    </article>
  );
}
