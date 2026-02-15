import FeaturedProducts from "@/components/home/FeaturedProducts";
import RecentArchivePosts from "@/components/home/RecentArchivePosts";
import ToolsShowcase from "@/components/home/ToolsShowcase";
import NewsletterSignup from "@/components/home/NewsletterSignup";
import Button from "@/components/ui/Button";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Badge from "@/components/ui/Badge";
import Typography from "@/components/ui/Typography";

export const metadata = {
  title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
  description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders and self-reliant builders.",
};

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <section className="mb-16">
        <BrutalistBlock className="p-8 md:p-12 text-center overflow-hidden" refTag="REF: HL_SYS_V2.1">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          <div className="relative z-10">
            {/* Status Badge */}
            <div className="mb-6">
              <Badge variant="outline" pulse>SYSTEM_ONLINE</Badge>
            </div>

            {/* Main Heading */}
            <Typography variant="h1">
              Tools for Those Who Build
              <br />
              <span className="text-accent">Their Own World</span>
            </Typography>

            {/* Subheading */}
            <Typography variant="body" className="max-w-2xl mx-auto text-foreground-secondary mb-8">
              Off-grid hardware, fabrication tools, and field documentation for homesteaders, 
              survivalists, and self-reliant builders.
            </Typography>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/tools/planting-calendar/" variant="primary">
                Try Free Tools
              </Button>
              <Button href="/shop/" variant="secondary">
                Browse Hardware
              </Button>
            </div>
          </div>
        </BrutalistBlock>
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Tools Showcase */}
      <ToolsShowcase />

      {/* Recent Archive Posts */}
      <RecentArchivePosts />

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Mission Statement */}
      <section className="mb-12">
        <BrutalistBlock className="border-l-4 border-l-accent p-8" title="The Mission">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <Typography variant="h4">Hardware</Typography>
              <Typography variant="small">
                Tools and devices designed for off-grid resilience. From LoRa mesh nodes 
                to portable power systems.
              </Typography>
            </div>
            <div>
              <Typography variant="h4">Knowledge</Typography>
              <Typography variant="small">
                Field-tested documentation on foraging, fabrication, and survival skills. 
                Written by those who live it.
              </Typography>
            </div>
            <div>
              <Typography variant="h4">Community</Typography>
              <Typography variant="small">
                Open designs. Shared knowledge. A network of builders helping builders 
                navigate the gray zones.
              </Typography>
            </div>
          </div>
        </BrutalistBlock>
      </section>

      {/* Terminal Hint */}
      <section className="text-center py-8">
        <Typography variant="small" className="font-mono">
          <span className="opacity-50">[</span>
          <kbd className="border border-foreground-primary px-1 mx-1">ALT</kbd>
          <span className="opacity-50">+</span>
          <kbd className="border border-foreground-primary px-1 mx-1">T</kbd>
          <span className="opacity-50">]</span>
          <span className="ml-2">ACCESS TERMINAL</span>
        </Typography>
      </section>
    </div>
  );
}
