import { getAllSlugs, getPostBySlug } from "../../lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";

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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Document Not Found | Homesteader Labs",
    };
  }

  return {
    title: `${post.title} | Homesteader Labs Archive`,
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

export default async function ArchivePostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Dynamically import the MDX content
  const { default: MDXContent } = await import(`../../../content/archive/${slug}.mdx`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link 
        href="/archive/"
        className="inline-flex items-center gap-2 text-sm mb-6 hover:text-[var(--accent)] transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to Archive</span>
      </Link>

      {/* Article */}
      <article className="brutalist-block bg-secondary">
        {/* Header */}
        <div className="border-b-2 border-theme-main p-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-theme-secondary">
            <span className="uppercase dymo-label">{post.category}</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              {post.author}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-theme-secondary text-lg">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <span 
                  key={tag}
                  className="text-[10px] border border-theme-main px-2 py-1 flex items-center gap-1"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-8 prose prose-invert max-w-none">
          <MDXContent />
        </div>

        {/* Footer */}
        <div className="border-t-2 border-theme-main p-8 bg-theme-sub/30">
          <div className="flex justify-between items-center">
            <div className="text-xs text-theme-secondary">
              <p>DOCUMENT_ID: {post.slug.toUpperCase().replace(/-/g, '_')}</p>
              <p>AUTHOR: {post.author}</p>
            </div>
            <Link 
              href="/archive/"
              className="text-xs border-2 border-theme-main px-4 py-2 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all"
            >
              Return to Archive
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
