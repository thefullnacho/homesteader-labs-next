import Link from "next/link";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";

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
    <FieldStationLayout stationId="HL_FIELD_NOTES">
      <div className="max-w-4xl mx-auto">
        <BrutalistBlock className="mb-8 p-6" variant="default">
          <div className="flex justify-between items-end">
            <div>
              <Typography variant="h2" className="mb-0">Field_Notes</Typography>
              <Typography variant="small" className="opacity-60">Log Entries & Situational Reports</Typography>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <Badge variant="outline">ARCHIVE_V.1.0</Badge>
              <Typography variant="small" className="font-mono text-[10px] opacity-40 uppercase mb-0">
                ENTRIES: {posts.length}
              </Typography>
            </div>
          </div>
        </BrutalistBlock>

        <div className="grid gap-8">
          {posts.map((post) => (
            <BrutalistBlock key={post.slug} className="p-6 group" refTag={post.date}>
              <div className="flex justify-between items-start mb-3">
                <Badge variant="status">{post.category}</Badge>
                <Typography variant="small" className="font-mono opacity-40 mb-0">{post.date}</Typography>
              </div>
              <Link href={`/blog/${post.slug}/`} className="group">
                <Typography variant="h3" className="mb-3 group-hover:text-accent transition-colors">
                  {post.title}
                </Typography>
              </Link>
              <Typography variant="body" className="opacity-70 mb-6 leading-relaxed">
                {post.excerpt}
              </Typography>
              <Link href={`/blog/${post.slug}/`}>
                <DymoLabel className="text-[10px] hover:scale-105 transition-transform">
                  READ_REPORT →
                </DymoLabel>
              </Link>
            </BrutalistBlock>
          ))}
        </div>

        {posts.length === 0 && (
          <BrutalistBlock className="text-center py-12" variant="default">
            <Typography variant="body" className="opacity-40 mb-0 italic">No entries found in log.</Typography>
          </BrutalistBlock>
        )}
      </div>
    </FieldStationLayout>
  );
}
