import Link from "next/link";

export default function BlogIndexPage() {
  // Placeholder for blog posts
  const posts = [
    {
      slug: "wild-berry-identification",
      title: "Wild Berry Identification Guide",
      excerpt: "Learn to identify, harvest, and use wild blackberries safely.",
      date: "2026-02-10",
      category: "Foraging"
    },
    {
      slug: "mushroom-foraging-101",
      title: "Mushroom Foraging 101",
      excerpt: "Essential safety tips and beginner species for new mycologists.",
      date: "2026-02-08",
      category: "Mycology"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
        <h2 className="text-2xl font-bold uppercase">Field_Notes</h2>
        <div className="text-[10px] text-theme-sub text-right">
          <p>ARCHIVE_V.1.0</p>
          <p>ENTRIES: {posts.length}</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl mx-auto">
        {posts.map((post) => (
          <article key={post.slug} className="brutalist-block bg-secondary p-6 hover:shadow-brutalist-lg transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] opacity-60">{post.category}</span>
              <span className="text-[10px] opacity-60">{post.date}</span>
            </div>
            <h3 className="text-xl font-bold mb-2">
              <Link href={`/blog/${post.slug}/`} className="hover:text-[var(--accent)] transition-colors">
                {post.title}
              </Link>
            </h3>
            <p className="text-sm opacity-80 mb-4">{post.excerpt}</p>
            <Link 
              href={`/blog/${post.slug}/`}
              className="dymo-label text-xs"
            >
              READ_MORE →
            </Link>
          </article>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-theme-secondary">No posts found in archive.</p>
        </div>
      )}
    </div>
  );
}
