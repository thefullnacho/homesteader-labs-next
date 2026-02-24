import { getAllProducts } from "@/lib/products";
import Link from "next/link";
import { Cpu, ChevronRight } from "lucide-react";

export default function FeaturedProducts() {
  const products = getAllProducts().slice(0, 3); // Show first 3 products

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6 border-b-2 border-border-primary pb-2">
        <h2 className="text-xl font-bold uppercase">Featured_Hardware</h2>
        <Link 
          href="/shop/"
          className="text-xs dymo-label opacity-80 hover:opacity-100"
        >
          VIEW_ALL
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id}
            href={`/shop/${product.id.toLowerCase()}/`}
            className="brutalist-block p-4 hover:shadow-brutalist-lg transition-all group"
          >
            {/* Product Image Placeholder */}
            <div className="h-32 bg-background-secondary border-b border-border-primary mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-2 left-2 text-[10px] font-bold opacity-50">
                {product.id}
              </div>
              <div className="w-16 h-16 border border-dashed border-border-primary rounded-full flex items-center justify-center">
                <Cpu size={32} className="text-foreground-primary opacity-50" />
              </div>
            </div>

            {/* Product Info */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm uppercase leading-tight">
                {product.name}
              </h3>
              <span className="font-bold text-[var(--accent)] text-sm">
                ${product.price}
              </span>
            </div>

            <p className="text-xs text-foreground-secondary mb-3 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[9px] border border-border-primary opacity-40 px-1">
                {product.category}
              </span>
              <span className="text-xs flex items-center gap-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
                View <ChevronRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
