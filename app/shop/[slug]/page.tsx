import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/products";
import { Metadata } from "next";
import ProductDetail from "./ProductDetail";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: "Product Not Found | Homesteader Labs",
    };
  }
  
  return {
    title: `${product.name} | Homesteader Labs`,
    description: product.description,
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

  return <ProductDetail product={product} />;
}
