import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/shop/ProductCard";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Badge from "@/components/ui/Badge";
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
    <FieldStationLayout stationId="HL_SHOP_CATALOG">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <BrutalistBlock className="mb-8 p-6" variant="default">
          <div className="flex justify-between items-end">
            <div>
              <Typography variant="h1" className="mb-0 text-2xl md:text-4xl">Hardware_Index</Typography>
              <Typography variant="small" className="opacity-60">Authorized Equipment & Digital Schematics</Typography>
            </div>
            
            <div className="text-right flex flex-col items-end gap-2">
              <Badge variant="outline">DB_V.4.2</Badge>
              <Typography variant="small" className="font-mono text-xs opacity-40 uppercase mb-0">
                RECORDS_FOUND: {allProducts.length}
              </Typography>
            </div>
          </div>
        </BrutalistBlock>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
            />
          ))}
        </div>

        {allProducts.length === 0 && (
          <BrutalistBlock className="text-center py-12" variant="default">
            <Typography variant="body" className="opacity-40 mb-0 italic">No products found in catalog.</Typography>
          </BrutalistBlock>
        )}
      </div>
    </FieldStationLayout>
  );
}
