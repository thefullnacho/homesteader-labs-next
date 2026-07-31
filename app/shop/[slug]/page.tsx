import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/products";
import { Metadata } from "next";
import ProductDetail from "./ProductDetail";
import WalkingManDetail from "./WalkingManDetail";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, orgRef, breadcrumbList, pageGraph } from "@/lib/schema";
import type { Product } from "@/lib/products";

/**
 * Product schema for a first-party item we fabricate and ship.
 *
 * Only fields the catalog actually holds are declared. There is no
 * `aggregateRating` and no `review`, because no rating or review exists; the
 * markup is the one place where inventing either is both a Google manual-action
 * risk and a straightforward lie to a buyer. `stock` maps to a real availability
 * value rather than defaulting to InStock, since the unit is pre-order.
 */
function productGraph(product: Product, slug: string) {
  const url = `${SITE_URL}/shop/${slug}/`;
  const availability =
    typeof product.stock === "string" && product.stock.toUpperCase() === "PRE-ORDER"
      ? "https://schema.org/PreOrder"
      : product.stock === 0
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock";

  return pageGraph(
    breadcrumbList([
      { name: "The Catalog", path: "/shop/" },
      { name: product.name, path: `/shop/${slug}/` },
    ]),
    {
      "@type": "Product",
      "@id": `${url}#product`,
      name: product.name,
      description: product.description,
      sku: product.id,
      category: product.category,
      brand: orgRef,
      ...(product.image ? { image: `${SITE_URL}${product.image}` } : {}),
      offers: {
        "@type": "Offer",
        url,
        price: product.price,
        priceCurrency: "USD",
        availability,
        seller: orgRef,
      },
    }
  );
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params;
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

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd data={productGraph(product, params.slug.toLowerCase())} />
      {product.id === 'WLK-MN-PRO' ? (
        <WalkingManDetail product={product} />
      ) : (
        <ProductDetail product={product} />
      )}
    </>
  );
}
