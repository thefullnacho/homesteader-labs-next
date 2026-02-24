"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { Plus, ExternalLink, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

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
    <FieldStationLayout stationId={`HL_PRODUCT_${product.id}`}>
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/shop/" className="inline-flex items-center text-xs font-bold uppercase tracking-tighter hover:text-accent transition-colors">
            <ChevronLeft size={14} className="mr-1" /> ← HARDWARE_INDEX
          </Link>
        </div>

        <BrutalistBlock className="p-4 md:p-8" variant="default" refTag={`REF_${product.id}`}>
          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="w-full md:w-1/2">
              <div className="aspect-square bg-background-primary/50 border-2 border-border-primary flex items-center justify-center relative overflow-hidden">
                {/* Background decoration */}
                <div 
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)',
                    backgroundSize: '40px 40px'
                  }}
                ></div>

                {product.image ? (
                  <div className="relative w-full h-full p-8 z-10">
                    <Image 
                      src={product.image} 
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-8xl opacity-10 grayscale z-10">📦</div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="w-full md:w-1/2 flex flex-col">
              <div className="mb-2">
                <Badge variant="outline">{product.category}</Badge>
              </div>
              
              <Typography variant="h2" className="mb-2">{product.name}</Typography>
              
              <Typography variant="h3" className="text-accent mb-6">
                ${product.price}
              </Typography>
              
              <Typography variant="body" className="opacity-80 mb-8">
                {product.description}
              </Typography>

              {/* Features */}
              {product.features && (
                <div className="mb-8">
                  <Typography variant="h4" className="text-xs opacity-50 mb-3 border-b border-border-primary/20 pb-1">Key Features</Typography>
                  <ul className="space-y-2">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="text-accent font-bold mt-0.5">»</span>
                        <span className="opacity-80 font-mono uppercase text-[11px]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs */}
              <div className="mb-8">
                <Typography variant="h4" className="text-xs opacity-50 mb-3 border-b border-border-primary/20 pb-1">Specifications</Typography>
                <div className="flex flex-wrap gap-2">
                  {product.specs.map((spec) => (
                    <Badge 
                      key={spec} 
                      variant="status"
                      className="text-[10px] opacity-70"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stock */}
              <div className="mb-8 flex items-center gap-3 bg-black/20 p-2 border-l-2 border-accent">
                <Typography variant="small" className="opacity-50 mb-0 font-mono">STATUS:</Typography>
                <span className={`text-xs font-bold font-mono tracking-tighter ${
                  typeof product.stock === 'number' && product.stock < 5 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {typeof product.stock === 'number' 
                    ? `${product.stock} UNITS_AVAILABLE` 
                    : product.stock}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto space-y-4">
                {product.category === 'AFFILIATE' ? (
                  <Button
                    href={product.affiliate?.url}
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    <ExternalLink size={18} className="mr-2" />
                    EXTERNAL_REQUISITION
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddToCart}
                    disabled={added}
                    variant={added ? 'outline' : 'primary'}
                    size="lg"
                    className={`w-full ${added ? 'bg-green-600/20 border-green-600 text-green-500 hover:bg-green-600/20 hover:text-green-500' : ''}`}
                  >
                    {added ? (
                      <>
                        <Check size={18} className="mr-2" />
                        ADDED_TO_LOG
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="mr-2" />
                        ADD_TO_REQUISITION
                      </>
                    )}
                  </Button>
                )}

                <Button 
                  href="/requisition/"
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  View Requisition Form ({totalItems} items)
                </Button>
              </div>
            </div>
          </div>
        </BrutalistBlock>

        {/* Technical Footer */}
        <div className="mt-12 text-center">
          <Typography variant="small" className="opacity-20 font-mono uppercase tracking-[0.2em]">
            Authorized Field Equipment • Homesteader Labs Fabrication Division
          </Typography>
        </div>
      </div>
    </FieldStationLayout>
  );
}
