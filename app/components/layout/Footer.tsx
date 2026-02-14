export default function Footer() {
  return (
    <footer className="border-t-2 border-theme-main bg-theme-sub mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            <span className="font-bold">HOMESTEADER_LABS</span>
            <span className="opacity-60 ml-2">v2.0 // NEXTJS MIGRATION</span>
          </div>
          
          <div className="flex gap-4 text-xs flex-wrap justify-center">
            <a href="/archive/" className="opacity-60 hover:opacity-100 transition-opacity">
              ARCHIVE
            </a>
            <a href="/shop/" className="opacity-60 hover:opacity-100 transition-opacity">
              SHOP
            </a>
            <a href="/tools/fabrication/" className="opacity-60 hover:opacity-100 transition-opacity">
              FABRICATION
            </a>
            <a href="/terms-of-fabrication/" className="opacity-60 hover:opacity-100 transition-opacity">
              TERMS
            </a>
            <a href="/warranty/" className="opacity-60 hover:opacity-100 transition-opacity">
              WARRANTY
            </a>
            <a href="/privacy/" className="opacity-60 hover:opacity-100 transition-opacity">
              PRIVACY
            </a>
          </div>
          
          <div className="text-xs opacity-40">
            © 2026 // FIELD READY
          </div>
        </div>
      </div>
    </footer>
  );
}
