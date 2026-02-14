import { products, getAllProducts } from "../lib/products";
import ProductCard from "../components/shop/ProductCard";

export default function ShopPage() {
  const allProducts = getAllProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4 relative">
        <h2 className="text-2xl font-bold uppercase">Hardware_Index</h2>
        
        <div className="text-[10px] text-theme-sub text-right">
          <p>DATABASE_V.4.2</p>
          <p>RECORDS_FOUND: {allProducts.length}</p>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
          />
        ))}
      </div>

      {allProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-theme-secondary">No products found in catalog.</p>
        </div>
      )}
    </div>
  );
}
