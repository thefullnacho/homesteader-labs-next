import { getAllPosts, getAllTags, getAllCategories } from "../lib/posts";
import Link from "next/link";

export const metadata = {
  title: "Archive | Homesteader Labs",
  description: "Field documentation, foraging guides, and survival knowledge from the community.",
};

export default function ArchivePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const categories = getAllCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4 relative">
        <div>
          <h2 className="text-2xl font-bold uppercase">Field_Archive</h2>
          <p className="text-xs text-theme-secondary mt-1">
            Documentation & Knowledge Base
          </p>
        </div>
        
        <div className="text-[10px] text-theme-secondary text-right">
          <p>RECORDS_FOUND: {posts.length}</p>
          <p>CATEGORIES: {categories.length}</p>
        </div>
      </div>

      {/* Filters */}
      {tags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase mb-3">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span 
                key={tag}
                className="text-[10px] border border-theme-main px-2 py-1 hover:bg-[var(--accent)] hover:text-white cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid gap-6">
        {posts.map((post) => (
          <article 
            key={post.slug}
            className="brutalist-block p-6 hover:shadow-brutalist-lg transition-all group"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-grow">
                {/* Meta */}
                <div className="flex items-center gap-3 mb-2 text-[10px] text-theme-secondary">
                  <span className="uppercase">{post.category}</span>
                  <span>//</span>
                  <span>{post.date}</span>
                  <span>//</span>
                  <span>{post.author}</span>
                </div>

                {/* Title */}
                <Link 
                  href={`/archive/${post.slug}/`}
                  className="block"
                >
                  <h3 className="text-xl font-bold uppercase mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {post.title}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-sm text-theme-secondary mb-4 leading-relaxed">
                  {post.excerpt || post.description}
                </p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
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

              {/* Read More */}
              <Link 
                href={`/archive/${post.slug}/`}
                className="shrink-0 border-2 border-theme-main px-4 py-2 text-xs font-bold uppercase hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all text-center"
              >
                Read_Document
              </Link>
            </div>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-theme-secondary">No documents found in archive.</p>
        </div>
      )}
    </div>
  );
}
