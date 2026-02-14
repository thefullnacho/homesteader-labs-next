import FeaturedProducts from "./components/home/FeaturedProducts";
import RecentArchivePosts from "./components/home/RecentArchivePosts";
import ToolsShowcase from "./components/home/ToolsShowcase";
import NewsletterSignup from "./components/home/NewsletterSignup";

export const metadata = {
  title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
  description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders and self-reliant builders.",
};

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <section className="mb-16">
        <div className="brutalist-block bg-secondary p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
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
            <div className="inline-flex items-center gap-2 border border-theme-main px-3 py-1 mb-6">
              <div className="w-2 h-2 bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider">SYSTEM_ONLINE</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 uppercase tracking-tight">
              Tools for Those Who Build
              <br />
              <span className="text-[var(--accent)]">Their Own World</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-theme-secondary mb-8">
              Off-grid hardware, fabrication tools, and field documentation for homesteaders, 
              survivalists, and self-reliant builders.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/tools/planting-calendar/"
                className="inline-flex items-center justify-center gap-2 border-2 border-theme-main px-8 py-3 font-bold uppercase hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all"
              >
                Try Free Tools
              </a>
              <a 
                href="/shop/"
                className="inline-flex items-center justify-center gap-2 border-2 border-theme-main px-8 py-3 font-bold uppercase bg-theme-sub hover:brightness-110 transition-all"
              >
                Browse Hardware
              </a>
            </div>
          </div>

          {/* Reference number decoration */}
          <div className="absolute bottom-4 right-4 text-[10px] opacity-40 font-mono">
            REF: HL_SYS_V2.0
          </div>
        </div>
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
        <div className="brutalist-block p-8 border-l-4 border-l-[var(--accent)]">
          <h2 className="text-2xl font-bold uppercase mb-4">The Mission</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold mb-2 uppercase text-sm">Hardware</h3>
              <p className="text-sm text-theme-secondary">
                Tools and devices designed for off-grid resilience. From LoRa mesh nodes 
                to portable power systems.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 uppercase text-sm">Knowledge</h3>
              <p className="text-sm text-theme-secondary">
                Field-tested documentation on foraging, fabrication, and survival skills. 
                Written by those who live it.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-2 uppercase text-sm">Community</h3>
              <p className="text-sm text-theme-secondary">
                Open designs. Shared knowledge. A network of builders helping builders 
                navigate the gray zones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Hint */}
      <section className="text-center py-8">
        <p className="text-xs text-theme-secondary font-mono">
          <span className="opacity-50">[</span>
          <kbd className="border border-theme-main px-1 mx-1">ALT</kbd>
          <span className="opacity-50">+</span>
          <kbd className="border border-theme-main px-1 mx-1">T</kbd>
          <span className="opacity-50">]</span>
          <span className="ml-2">ACCESS TERMINAL</span>
        </p>
      </section>
    </div>
  );
}
