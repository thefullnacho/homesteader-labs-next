import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Tag } from "lucide-react";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params;
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
  const { slug } = params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Dynamically import the MDX content
  const { default: MDXContent } = await import(`../../../content/archive/${slug}.mdx`);

  return (
    <FieldStationLayout stationId={`HL_DOC_${post.slug.toUpperCase().replace(/-/g, '_')}`}>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/archive/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back_to_Archive</span>
          </Link>
        </div>

        {/* Article */}
        <BrutalistBlock className="p-0 overflow-hidden" variant="default" refTag={`DOC_REF_${post.date.replace(/-/g, '')}`}>
          {/* Header */}
          <div className="border-b-2 border-border-primary p-6 md:p-10 bg-background-primary/30">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <DymoLabel>{post.category}</DymoLabel>
              <div className="flex items-center gap-4 text-[10px] font-mono opacity-50 uppercase">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-accent" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-accent" />
                  {post.author}
                </span>
              </div>
            </div>

            {/* Title */}
            <Typography variant="h1" className="mb-4 text-3xl md:text-5xl leading-tight">
              {post.title}
            </Typography>

            {/* Description */}
            <Typography variant="body" className="opacity-70 text-lg md:text-xl leading-relaxed italic border-l-2 border-accent pl-4">
              {post.description}
            </Typography>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8">
                {post.tags.map((tag) => (
                  <Badge 
                    key={tag}
                    variant="status"
                    className="text-[10px]"
                  >
                    <Tag size={10} className="mr-1 text-accent" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 prose prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-bold prose-p:leading-relaxed prose-a:text-accent hover:prose-a:brightness-110 prose-code:text-accent prose-code:bg-background-secondary prose-code:px-1 prose-code:rounded-sm">
            <MDXContent />
          </div>

          {/* Footer */}
          <div className="border-t-2 border-border-primary p-6 md:p-10 bg-background-secondary/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="text-[10px] font-mono opacity-40 uppercase tracking-tighter">
                <p>DOCUMENT_ID: {post.slug.toUpperCase().replace(/-/g, '_')}</p>
                <p>OPERATOR: {post.author}</p>
                <p>STATUS: FIELD_VERIFIED</p>
              </div>
              <Button 
                href="/archive/"
                variant="secondary"
                size="sm"
              >
                Return_to_Archive
              </Button>
            </div>
          </div>
        </BrutalistBlock>

        {/* Technical Notice */}
        <div className="mt-8 text-center px-4">
          <Typography variant="small" className="opacity-20 font-mono text-[9px] uppercase tracking-[0.2em] leading-loose">
            Warning: The information contained in this field manual is for educational purposes only. 
            Homesteader Labs assumes no responsibility for actions taken based on this documentation.
          </Typography>
        </div>
      </div>
    </FieldStationLayout>
  );
}
