import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/shop/ProductCard";
import { SectionHead, Stamp } from "@/components/field/kit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hardware Catalog — Off-Grid Survival & Mesh Networking Equipment",
  description: "Authorized hardware for self-reliant homesteaders. Off-grid electronics, mesh networking gear, and custom-fabricated survival equipment.",
  openGraph: {
    title: "Hardware Catalog — Off-Grid Survival & Mesh Networking Equipment",
    description: "Authorized hardware for self-reliant homesteaders. Off-grid electronics, mesh networking gear, and custom-fabricated survival equipment.",
    type: "website",
  },
};

export default function ShopPage() {
  const allProducts = getAllProducts();

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <span>Homesteader Labs</span>
            <span>/</span>
            <span>The Catalog</span>
            <span className="ml-auto">Records on file: {allProducts.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Field-tested</Stamp>
            <Stamp color="text-slateblue" rotate="1.8deg">No subscriptions</Stamp>
            <Stamp color="text-rust" rotate="-2.2deg">Offline-first</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            The catalog
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            A short list with a long service life. Nothing earns a page in this
            book until it has survived a season on our own land.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pt-12 pb-12">
        {/* Catalog entries */}
        <SectionHead
          no="§1"
          title="Field Equipment"
          right={`${allProducts.length} item${allProducts.length === 1 ? "" : "s"} on file`}
        />

        {allProducts.length > 0 ? (
          <div className="space-y-10 mb-14">
            {allProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                no={String(i + 1).padStart(2, "0")}
              />
            ))}
          </div>
        ) : (
          <div className="card-paper grain p-8 text-center mb-14">
            <p className="italic text-ink/70 relative z-[2]">
              The catalog is empty. Check back after the next fabrication run.
            </p>
          </div>
        )}

        {/* Under fabrication */}
        <div className="border-2 border-dashed border-ink/40 p-6 text-ink/60 mb-10">
          <span className="font-mono text-[0.64rem] uppercase tracking-widest block mb-2">
            Under fabrication
          </span>
          <h2 className="font-display uppercase text-lg leading-tight mb-2">
            The next pages
          </h2>
          <p className="text-[0.95rem] leading-snug max-w-2xl">
            Mesh radio nodes and the BLE sensor coins are on the bench now.
            They get a catalog page when they survive outside, not before.
          </p>
        </div>

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Field-tested · No subscriptions · No cloud dependency
        </p>
      </div>
    </>
  );
}
