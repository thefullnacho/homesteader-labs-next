import { getAllPosts, getAllTags, getAllCategories } from "../lib/posts";
import Link from "next/link";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Archive | Homesteader Labs",
  description: "Field documentation, foraging guides, and survival knowledge from the community.",
};

export default function ArchivePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const categories = getAllCategories();

  return (
    <FieldStationLayout stationId="HL_FIELD_ARCHIVE">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <BrutalistBlock className="mb-8 p-6" variant="default">
          <div className="flex justify-between items-end">
            <div>
              <Typography variant="h2" className="mb-0">Field_Archive</Typography>
              <Typography variant="small" className="opacity-60">Documentation & Community Knowledge Base</Typography>
            </div>
            
            <div className="text-right flex flex-col items-end gap-2">
              <Badge variant="outline">RECORDS: {posts.length}</Badge>
              <Typography variant="small" className="font-mono text-[10px] opacity-40 uppercase mb-0">
                CATEGORIES: {categories.length}
              </Typography>
            </div>
          </div>
        </BrutalistBlock>

        {/* Filters */}
        {tags.length > 0 && (
          <div className="mb-8">
            <Typography variant="h4" className="text-xs opacity-50 mb-3">Filter_By_Tags:</Typography>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge 
                  key={tag}
                  variant="status"
                  className="cursor-pointer hover:bg-accent hover:text-white transition-colors"
                >
                  {tag}
                </Badge>
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
                      {post.date} // {post.author}
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
                          className="text-[9px] opacity-40 border-foreground-primary/30"
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
                  Read_Document
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
