import { notFound } from "next/navigation";
import Link from "next/link";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";
import { ChevronLeft, Tag } from "lucide-react";

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
    <FieldStationLayout stationId={`HL_NOTE_${params.slug.toUpperCase().replace(/-/g, '_')}`}>
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/blog/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Back_to_Notes</span>
          </Link>
        </div>

        <BrutalistBlock className="p-0 overflow-hidden" variant="default" refTag="LOG_ENTRY">
          {/* Post Header */}
          <header className="p-6 md:p-10 border-b-2 border-border-primary bg-background-primary/30">
            <div className="flex justify-between items-center mb-6">
              <Badge variant="status">Foraging</Badge>
              <Typography variant="small" className="font-mono opacity-40 mb-0">2026-02-10</Typography>
            </div>
            <Typography variant="h1" className="mb-4 text-3xl md:text-5xl leading-tight capitalize">
              {params.slug.replace(/-/g, " ")}
            </Typography>
            <Typography variant="body" className="opacity-70 text-lg leading-relaxed mb-0">
              A comprehensive guide to identifying and harvesting wild foods safely.
            </Typography>
          </header>

          {/* Post Content */}
          <div className="p-6 md:p-10 prose prose-invert max-w-none prose-p:leading-relaxed">
            <p>
              This is a placeholder for the actual blog post content. In the full implementation, 
              this would render MDX content with rich formatting, images, and interactive components.
            </p>
            
            <div className="bg-background-secondary p-6 my-8 border-l-4 border-accent relative">
              <Typography variant="body" className="italic opacity-80 mb-0">
                "Always verify identification with multiple sources before consuming wild plants."
              </Typography>
              <div className="absolute -bottom-2 -right-2 text-[8px] opacity-20 font-mono">SAFETY_PROTOCOL_V.1</div>
            </div>

            <p>
              The full content management system with MDX support will be implemented in Phase 3 
              of the migration.
            </p>
          </div>

          {/* Post Footer */}
          <footer className="p-6 md:p-10 border-t-2 border-border-primary bg-background-secondary/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <Link href="/blog/">
                <DymoLabel className="text-[10px] hover:scale-105 transition-transform">
                  ← BACK_TO_LOG
                </DymoLabel>
              </Link>
              <div className="flex items-center gap-3">
                <Typography variant="small" className="opacity-40 mb-0 font-mono">TAGS:</Typography>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[9px] opacity-50 border-foreground-primary/30">foraging</Badge>
                  <Badge variant="outline" className="text-[9px] opacity-50 border-foreground-primary/30">safety</Badge>
                </div>
              </div>
            </div>
          </footer>
        </BrutalistBlock>

        {/* Technical Notice */}
        <div className="mt-8 text-center px-4">
          <Typography variant="small" className="opacity-20 font-mono text-[9px] uppercase tracking-[0.2em]">
            Authorized Field Note • Homesteader Labs Knowledge Transfer
          </Typography>
        </div>
      </div>
    </FieldStationLayout>
  );
}
