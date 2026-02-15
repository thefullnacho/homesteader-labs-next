"use client";

import { FileText, Unlock, Cpu, ChevronRight, Plus } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";

function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant="secondary"
      size="sm"
      className="w-full mt-4"
      aria-label={`Add ${product.name} to cart`}
    >
      <Plus size={12} className="mr-2" aria-hidden="true" />
      Add_To_Requisition <ChevronRight size={12} className="ml-1" aria-hidden="true" />
    </Button>
  );
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  specs: string[];
  image?: string;
  affiliate?: {
    url: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <BrutalistBlock 
      className="group flex flex-col h-full p-0 overflow-hidden" 
      refTag={product.id}
    >
      <div className="h-48 bg-background-primary/50 border-b-2 border-border-primary relative overflow-hidden p-4 flex items-center justify-center">
        {/* Background decoration */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)',
            backgroundSize: '30px 30px'
          }}
        ></div>

        {product.image && product.image.startsWith('/') ? (
          <img 
            src={product.image} 
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-32 h-32 object-contain z-10 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div 
            className="w-24 h-24 border-2 border-dashed border-border-primary/50 rounded-full flex items-center justify-center bg-background-primary/50 z-10 group-hover:scale-110 transition-transform duration-500" 
            aria-hidden="true"
          >
            {product.category === 'DIGITAL' ? (
              <FileText size={40} className="text-foreground-primary" />
            ) : product.category === 'ZERO_DAY' ? (
              <Unlock size={40} className="text-accent" />
            ) : (
              <Cpu size={40} className="text-foreground-primary" />
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-2">
          <Typography variant="h4" className="mb-0 leading-tight flex-grow">{product.name}</Typography>
          <Badge variant="solid" className="bg-accent text-white border-accent shrink-0">${product.price}</Badge>
        </div>
        
        <Typography variant="small" className="opacity-70 mb-4 flex-grow leading-relaxed">
          {product.description}
        </Typography>

        <div className="space-y-4 mt-auto">
          <div className="flex flex-wrap gap-1">
            {product.specs.map((s) => (
              <Badge key={s} variant="outline" className="text-[8px] px-1 py-0 border-foreground-primary/30 opacity-60">
                {s}
              </Badge>
            ))}
          </div>
          
          {product.category === 'AFFILIATE' ? (
            <Button
              href={product.affiliate?.url}
              variant="primary"
              size="sm"
              className="w-full"
              aria-label={`View ${product.name} on external site`}
            >
              EXTERNAL_LINK <ChevronRight size={12} className="ml-1" aria-hidden="true" />
            </Button>
          ) : (
            <AddToCartButton product={product} />
          )}
        </div>
      </div>
    </BrutalistBlock>
  );
}
