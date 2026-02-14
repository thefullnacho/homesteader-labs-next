"use client";

import { FileText, Unlock, Cpu, ChevronRight, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext";

function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  return (
    <button
      onClick={handleAddToCart}
      className="w-full mt-4 border-2 border-theme-main text-xs font-bold py-2 flex justify-center items-center gap-2 uppercase transition-all bg-transparent text-theme-main hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      aria-label={`Add ${product.name} to cart`}
    >
      <Plus size={12} aria-hidden="true" />
      Add_To_Requisition <ChevronRight size={12} aria-hidden="true" />
    </button>
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
    <div className="group brutalist-block hover:shadow-brutalist-lg transition-all duration-200 flex flex-col h-full relative p-1">
      <div className="absolute top-0 right-0 p-1">
        <div className="w-2 h-2 border border-theme-main rounded-full bg-transparent group-hover:bg-[var(--accent)] transition-colors"></div>
      </div>

      <div className="h-48 bg-theme-sub border-b border-theme-main relative overflow-hidden p-4 flex items-center justify-center">
        <div className="absolute top-2 left-2 text-[10px] font-bold bg-theme-main border border-theme-main px-1 z-10 opacity-70">
          {product.id}
        </div>
        <div 
          className="absolute inset-0 opacity-5"
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
            width="200"
            height="200"
            className="w-32 h-32 object-contain z-10 group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div 
            className="w-24 h-24 border border-dashed border-theme-main rounded-full flex items-center justify-center bg-theme-main z-10 group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0" 
            aria-hidden="true"
          >
            {product.category === 'DIGITAL' ? (
              <FileText size={40} className="text-theme-main" />
            ) : product.category === 'ZERO_DAY' ? (
              <Unlock size={40} className="text-[var(--accent)]" />
            ) : (
              <Cpu size={40} className="text-theme-main" />
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-none w-2/3">{product.name}</h3>
          <span className="font-bold text-white bg-[var(--accent)] px-1 text-sm">${product.price}</span>
        </div>
        <p className="text-xs text-theme-sub mb-4 flex-grow leading-relaxed">{product.description}</p>

        <div className="space-y-2 mt-auto">
          <div className="flex flex-wrap gap-1">
            {product.specs.map((s) => (
              <span key={s} className="text-[9px] border border-theme-main opacity-40 px-1 text-theme-sub">
                {s}
              </span>
            ))}
          </div>
          
          {product.category === 'AFFILIATE' ? (
            <a
              href={product.affiliate?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-4 bg-[var(--accent)] text-white text-xs font-bold py-2 flex justify-center items-center gap-2 uppercase transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white text-center"
              aria-label={`View ${product.name} on external site`}
            >
              EXTERNAL_LINK <ChevronRight size={12} aria-hidden="true" />
            </a>
          ) : (
            <AddToCartButton product={product} />
          )}
        </div>
      </div>
    </div>
  );
}
