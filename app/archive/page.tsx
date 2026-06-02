import { getAllPosts, getAllTags } from "@/lib/posts";
import Link from "next/link";
import Image from "next/image";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Archive",
  description: "Field documentation, foraging guides, and survival knowledge from the community.",
};

export default function ArchivePage({ searchParams }: { searchParams: { tag?: string } }) {
  const allPosts = getAllPosts();
  const tags = getAllTags();
  const activeTag = searchParams.tag;
  const posts = activeTag
    ? allPosts.filter((post) => post.tags.includes(activeTag))
    : allPosts;

  return (
    <FieldStationLayout stationId="HL_FIELD_ARCHIVE">
      <div className="max-w-5xl mx-auto">
        {/* Header image */}
        <div className="relative w-full aspect-[16/9] mb-8 overflow-hidden">
          <Image
            src="/images/field_notes.png"
            alt="Field Notes"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b-2 border-border-primary pb-4">
          <div>
            <Typography variant="h1" className="mb-0 text-2xl md:text-4xl">Field Notes</Typography>
            <Typography variant="small" className="opacity-60">Documentation & community knowledge base</Typography>
          </div>
          <Typography variant="small" className="font-mono text-xs opacity-40 uppercase mb-0">
            {posts.length} articles
          </Typography>
        </div>

        {/* Filters */}
        {tags.length > 0 && (
          <div className="mb-8">
            <Typography variant="h4" className="text-xs opacity-50 mb-3">Filter by tag:</Typography>
            <div className="flex flex-wrap gap-2">
              {activeTag && (
                <Link href="/archive/">
                  <Badge
                    variant="solid"
                    className="cursor-pointer bg-accent border-accent text-white"
                  >
                    ✕ Clear
                  </Badge>
                </Link>
              )}
              {tags.map((tag) => (
                <Link key={tag} href={`/archive/?tag=${encodeURIComponent(tag)}`}>
                  <Badge 
                    variant={activeTag === tag ? "solid" : "status"}
                    className={`cursor-pointer hover:bg-accent hover:text-white transition-colors ${activeTag === tag ? "bg-accent border-accent text-white" : ""}`}
                  >
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid gap-8">
          {posts.map((post) => (
            <BrutalistBlock 
              key={post.slug}
              className="group p-6"
              refTag={post.category.toUpperCase()}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                <div className="flex-grow">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    <Typography variant="small" className="font-mono opacity-40 uppercase mb-0 tracking-tighter">
                      {post.date} {"//"} {post.author}
                    </Typography>
                  </div>

                  {/* Title */}
                  <Link 
                    href={`/archive/${post.slug}/`}
                    className="block group"
                  >
                    <Typography variant="h3" className="mb-3 group-hover:text-accent transition-colors">
                      {post.title}
                    </Typography>
                  </Link>

                  {/* Description */}
                  <Typography variant="body" className="opacity-70 mb-4 leading-relaxed line-clamp-2">
                    {post.excerpt || post.description}
                  </Typography>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge 
                          key={tag}
                          variant="outline"
                          className="text-[11px] opacity-40 border-foreground-primary/30"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read More */}
                <Button 
                  href={`/archive/${post.slug}/`}
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  Read →
                </Button>
              </div>
            </BrutalistBlock>
          ))}
        </div>

        {posts.length === 0 && (
          <BrutalistBlock className="text-center py-12" variant="default">
            <Typography variant="body" className="opacity-40 mb-0 italic">No documents found in archive.</Typography>
          </BrutalistBlock>
        )}
      </div>
    </FieldStationLayout>
  );
}
