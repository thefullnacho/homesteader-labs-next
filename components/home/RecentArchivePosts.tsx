import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import { Calendar, ArrowRight, FileText } from "lucide-react";

export default function RecentArchivePosts() {
  const posts = getAllPosts().slice(0, 3); // Show first 3 posts

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b-2 border-theme-main pb-2">
        <h2 className="text-xl font-bold uppercase">Latest_Field_Notes</h2>
        <Link 
          href="/archive/"
          className="text-xs dymo-label opacity-80 hover:opacity-100"
        >
          VIEW_ARCHIVE
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link 
            key={post.slug}
            href={`/archive/${post.slug}/`}
            className="brutalist-block p-4 hover:shadow-brutalist-lg transition-all group flex gap-4 items-start"
          >
            {/* Icon */}
            <div className="shrink-0 w-12 h-12 border border-theme-main flex items-center justify-center">
              <FileText size={20} className="text-theme-main opacity-60" />
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              {/* Meta */}
              <div className="flex items-center gap-3 mb-1 text-[10px] text-theme-secondary">
                <span className="uppercase">{post.category}</span>
                <span>{"//"}</span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {post.date}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold uppercase mb-1 group-hover:text-[var(--accent)] transition-colors truncate">
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-xs text-theme-secondary line-clamp-2">
                {post.excerpt || post.description}
              </p>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag}
                      className="text-[9px] border border-theme-main opacity-40 px-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight size={20} className="text-[var(--accent)]" />
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="brutalist-block p-8 text-center">
          <p className="text-theme-secondary">No field notes available.</p>
        </div>
      )}
    </section>
  );
}
