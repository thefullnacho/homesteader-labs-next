"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { Plus, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import type { Product } from "../../lib/products";

interface ProductDetailProps {
  product: Product;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart, totalItems } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-xs opacity-60">
        <Link href="/shop/" className="hover:text-[var(--accent)]">← HARDWARE_INDEX</Link>
        <span className="mx-2">/</span>
        <span>{product.id}</span>
      </div>

      <div className="brutalist-block bg-secondary p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image */}
          <div className="w-full md:w-1/2">
            <div className="aspect-square bg-theme-sub border border-theme-main flex items-center justify-center relative">
              <div className="absolute top-2 left-2 text-[10px] font-bold bg-theme-main border border-theme-main px-1 opacity-70">
                {product.id}
              </div>
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="text-6xl opacity-30">📦</div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2">
            <div className="text-xs opacity-60 mb-2">{product.category}</div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-[var(--accent)] mb-4">
              ${product.price}
            </p>
            <p className="text-sm mb-6 leading-relaxed">{product.description}</p>

            {/* Features */}
            {product.features && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-wider opacity-60 mb-2">Key Features</h3>
                <ul className="text-sm space-y-1">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[var(--accent)]">→</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider opacity-60 mb-2">Specifications</h3>
              <div className="flex flex-wrap gap-2">
                {product.specs.map((spec) => (
                  <span 
                    key={spec} 
                    className="text-[10px] border border-theme-main px-2 py-1 opacity-70"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Stock */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-xs opacity-60">AVAILABILITY:</span>
              <span className={`text-sm font-bold ${
                typeof product.stock === 'number' && product.stock < 5 
                  ? 'text-red-500' 
                  : 'text-green-600'
              }`}>
                {typeof product.stock === 'number' 
                  ? `${product.stock} UNITS IN STOCK` 
                  : product.stock}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {product.category === 'AFFILIATE' ? (
                <a
                  href={product.affiliate?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[var(--accent)] text-white text-sm font-bold py-3 flex justify-center items-center gap-2 uppercase transition-all hover:brightness-110"
                >
                  <ExternalLink size={16} />
                  View on External Site
                </a>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  disabled={added}
                  className={`w-full border-2 text-sm font-bold py-3 flex justify-center items-center gap-2 uppercase transition-all ${
                    added 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : 'border-theme-main bg-transparent text-theme-main hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} />
                      ADDED TO REQUISITION
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      ADD TO REQUISITION
                    </>
                  )}
                </button>
              )}

              <Link 
                href="/requisition/"
                className="w-full border border-theme-main text-sm py-2 flex justify-center items-center gap-2 uppercase transition-all hover:bg-theme-sub text-center"
              >
                View Requisition Form ({totalItems} items)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
