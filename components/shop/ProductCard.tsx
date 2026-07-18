"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import type { Product } from "@/lib/products";
import { Stamp, Tape } from "@/components/field/kit";

function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.72rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors whitespace-nowrap"
      aria-label={`Add ${product.name} to requisition`}
    >
      {added ? "✓ Logged" : "Add to requisition →"}
    </button>
  );
}

export default function ProductCard({
  product,
  no = "01",
}: {
  product: Product;
  no?: string;
}) {
  const detailHref = `/shop/${product.id.toLowerCase()}/`;
  const preOrder = typeof product.stock === "string";

  return (
    <article className="card-paper grain relative">
      <Tape className="-top-3 left-1/3 rotate-[-4deg] z-[3]" />
      <div className="grid md:grid-cols-[1.1fr_1.3fr] relative z-[2]">
        {/* Photograph */}
        <div className="relative min-h-[240px] border-b-2 md:border-b-0 md:border-r-2 border-ink overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full font-mono text-[0.7rem] uppercase tracking-widest text-ink/40">
              No photograph on file
            </div>
          )}
          <span className="absolute top-2 left-2 bg-manila border border-ink/40 px-1.5 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.18em]">
            No. {no}
          </span>
        </div>

        {/* Catalog entry */}
        <div className="p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="font-mono text-[0.64rem] uppercase tracking-[0.18em] text-ink/55 bg-kraft px-1.5 py-0.5 border border-ink/40">
              {product.category}
            </span>
            <Stamp color={preOrder ? "text-rust" : "text-moss"} rotate="2deg">
              {preOrder ? product.stock : "In stock"}
            </Stamp>
          </div>

          <h3 className="font-display uppercase text-2xl leading-tight">
            <Link href={detailHref} className="hover:text-marker transition-colors">
              {product.name}
            </Link>
          </h3>

          <p className="mt-2 text-[0.98rem] text-ink/85 leading-snug">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
            {product.specs.map((spec) => (
              <span
                key={spec}
                className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/60 bg-paper/70 px-1.5 py-0.5 border border-ink/30"
              >
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 flex-wrap">
            <span className="font-display text-3xl">${product.price}</span>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href={detailHref}
                className="font-mono text-[0.72rem] uppercase tracking-wider underline decoration-marker decoration-2 underline-offset-4 hover:text-marker whitespace-nowrap"
              >
                Spec sheet →
              </Link>
              {product.category === "AFFILIATE" ? (
                <a
                  href={product.affiliate?.url}
                  rel="noopener"
                  className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.72rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors whitespace-nowrap"
                >
                  View at supplier →
                </a>
              ) : (
                <AddToCartButton product={product} />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
