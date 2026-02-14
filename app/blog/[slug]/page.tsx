import { notFound } from "next/navigation";
import Link from "next/link";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return [
    { slug: "wild-berry-identification" },
    { slug: "mushroom-foraging-101" }
  ];
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  // This would normally fetch from a CMS or MDX files
  // For now, showing a placeholder structure
  
  const validSlugs = ["wild-berry-identification", "mushroom-foraging-101"];
  
  if (!validSlugs.includes(params.slug)) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <article className="brutalist-block bg-secondary p-8">
        {/* Post Header */}
        <header className="mb-8 border-b border-theme-main/30 pb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] opacity-60">Foraging</span>
            <span className="text-[10px] opacity-60">2026-02-10</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 capitalize">
            {params.slug.replace(/-/g, " ")}
          </h1>
          <p className="text-sm opacity-80">
            A comprehensive guide to identifying and harvesting wild foods safely.
          </p>
        </header>

        {/* Post Content */}
        <div className="prose prose-invert max-w-none">
          <p className="text-sm leading-relaxed mb-4">
            This is a placeholder for the actual blog post content. In the full implementation, 
            this would render MDX content with rich formatting, images, and interactive components.
          </p>
          
          <div className="bg-theme-sub p-4 my-6 border-l-4 border-[var(--accent)]">
            <p className="text-xs italic opacity-80">
              "Always verify identification with multiple sources before consuming wild plants."
            </p>
          </div>

          <p className="text-sm leading-relaxed">
            The full content management system with MDX support will be implemented in Phase 3 
            of the migration.
          </p>
        </div>

        {/* Post Footer */}
        <footer className="mt-8 pt-4 border-t border-theme-main/30">
          <div className="flex justify-between items-center">
            <Link href="/blog/" className="dymo-label text-xs">
              ← BACK_TO_ARCHIVE
            </Link>
            <div className="flex gap-2">
              <span className="text-[10px] opacity-60">TAGS:</span>
              <span className="text-[10px] border border-theme-main px-1">foraging</span>
              <span className="text-[10px] border border-theme-main px-1">safety</span>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
