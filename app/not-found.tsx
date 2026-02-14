import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full brutalist-block bg-secondary p-8 md:p-12 text-center">
        {/* Header */}
        <div className="text-8xl font-bold mb-4" style={{ color: 'var(--accent)' }}>
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">
          &gt;&gt; NODE NOT FOUND
        </h1>
        <p className="text-theme-secondary">
          The requested sector does not exist in the archive.
          <br />
          The data may have been moved, corrupted, or never existed.
        </p>

        {/* Technical Details */}
        <div className="bg-primary p-4 my-8 font-mono text-xs">
          <div className="flex justify-between mb-2 opacity-60">
            <span>STATUS:</span>
            <span style={{ color: 'var(--accent)' }}>SECTOR_UNREACHABLE</span>
          </div>
          <div className="flex justify-between opacity-60">
            <span>REF:</span>
            <span>404_{Math.random().toString(36).substring(7).toUpperCase()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/"
            className="brutalist-block p-4 text-left hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="font-bold">RETURN TO BASE</div>
            <div className="text-xs opacity-60">Navigate to home sector</div>
          </Link>
          
          <Link
            href="/shop/"
            className="brutalist-block p-4 text-left hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <div className="font-bold">BROWSE SUPPLIES</div>
            <div className="text-xs opacity-60">Access the shop catalog</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
