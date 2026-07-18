"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import type { Product } from "@/lib/products";
import { Stamp, Tape } from "@/components/field/kit";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart, totalItems } = useCart();
  const [added, setAdded] = useState(false);
  const preOrder = typeof product.stock === "string";

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/shop/" className="hover:text-marker transition-colors">
              The Catalog
            </Link>
            <span>/</span>
            <span>{product.name}</span>
            <span className="ml-auto">Ref: {product.id}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-slateblue">{product.category}</Stamp>
            <Stamp color={preOrder ? "text-rust" : "text-moss"} rotate="1.8deg">
              {preOrder ? product.stock : "In stock"}
            </Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            {product.name}
          </h1>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pt-12 pb-12">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-start mb-14">
          {/* Photograph */}
          <div>
            <figure className="relative rotate-slight card-paper p-2">
              <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-3deg] z-[3]" />
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full border-2 border-dashed border-ink/30 font-mono text-[0.7rem] uppercase tracking-widest text-ink/40">
                    No photograph on file
                  </div>
                )}
              </div>
              <figcaption className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 pt-2 px-1">
                Field unit · {product.id}
              </figcaption>
            </figure>

            {product.features && (
              <div className="mt-10">
                <h2 className="font-display uppercase text-xl leading-tight mb-4">
                  What it does
                </h2>
                <ul className="space-y-2.5">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start text-[0.98rem] leading-snug">
                      <span className="field-checkbox mt-1" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Requisition box */}
          <aside className="card-paper grain p-5">
            <div className="relative z-[2]">
              <p className="text-[0.98rem] text-ink/85 leading-snug border-b border-dotted border-ink/40 pb-4 mb-4">
                {product.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {product.specs.map((spec) => (
                  <span
                    key={spec}
                    className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/60 bg-paper/70 px-1.5 py-0.5 border border-ink/30"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              <div className="flex items-baseline justify-between font-mono text-[0.7rem] uppercase tracking-wider border-b border-dotted border-ink/40 pb-3 mb-4">
                <span className="text-ink/60">Status</span>
                <span className={preOrder ? "text-rust font-bold" : "text-moss font-bold"}>
                  {preOrder ? product.stock : `${product.stock} units available`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="font-display text-4xl">${product.price}</span>
              </div>

              {product.category === "AFFILIATE" ? (
                <a
                  href={product.affiliate?.url}
                  rel="noopener"
                  className="block text-center bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
                >
                  View at supplier →
                </a>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={added}
                  className="w-full bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:bg-moss disabled:border-moss"
                >
                  {added ? "✓ Logged to requisition" : "Add to requisition →"}
                </button>
              )}

              <Link
                href="/requisition/"
                className="block text-center mt-4 font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker"
              >
                View requisition ({totalItems} item{totalItems === 1 ? "" : "s"})
              </Link>
            </div>
          </aside>
        </div>

        {/* Station footer */}
        <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
          Authorized field equipment · Homesteader Labs fabrication division
        </p>
      </div>
    </>
  );
}
