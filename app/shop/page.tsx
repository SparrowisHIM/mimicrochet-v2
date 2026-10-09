import type { Metadata } from "next";
import { IdeasSection } from "@/components/shop/ideas-section";
import { ShopView } from "@/components/shop/shop-view";
import { categories, type Category } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "One-of-one crochet pieces ready now, and pieces Mimi makes for you in your size.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const type = one(q.type);
  const category = one(q.category);

  return (
    <>
      <ShopView
        initial={{
          type: type === "ready" || type === "made" ? type : "all",
          category: categories.includes(category as Category) ? (category as Category) : "all",
          query: one(q.q) ?? "",
          search: one(q.search) === "1",
        }}
      />
      <IdeasSection />
    </>
  );
}
