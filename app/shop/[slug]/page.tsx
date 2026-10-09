import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { ProductView } from "@/components/product/product-view";
import { getProduct, priceLabel, products, relatedProducts } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.description} ${priceLabel(p)}. Handmade by Mimi in Port Harcourt.`,
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const related = relatedProducts(product);

  return (
    <>
      <ProductView key={product.slug} product={product} />
      <section className="bg-white py-14 lg:py-24">
        <div className="container-page flex flex-col gap-7 lg:gap-10">
          <h2 className="font-serif text-[28px] leading-[1.1] tracking-[-0.01em] lg:text-[40px]">More one-of-ones</h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-4 lg:gap-6">
            {related.map((p) => (
              <li key={p.slug}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
