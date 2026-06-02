import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/products";
import { Metadata } from "next";
import ProductDetail from "./ProductDetail";
import WalkingManDetail from "./WalkingManDetail";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description,
    },
  };
}

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    slug: product.id.toLowerCase(),
  }));
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  if (product.id === 'WLK-MN-PRO') {
    return <WalkingManDetail product={product} />;
  }

  return <ProductDetail product={product} />;
}
