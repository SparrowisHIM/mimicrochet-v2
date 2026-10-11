"use client";

import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/product/save-button";
import { SizeChip } from "@/components/product/size-chip";
import { priceLabel, tagLabel, type Product } from "@/lib/products";
import { useSold } from "@/lib/stock";

export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 310px, 50vw",
  preload = false,
}: {
  product: Product;
  sizes?: string;
  preload?: boolean;
}) {
  const [main, second] = product.images;
  // A one-of-one that has sold stays in the shop, washed out and marked Sold, so it can be made again.
  const sold = useSold(product.slug) && product.kind === "ready";
  // Pieces that go in the bag are bought; the rest (and sold pieces) are requested and made.
  const action = product.checkout === "bag" && !sold ? "Buy now" : "Have it made";

  return (
    <article className="group relative flex h-full flex-col gap-2.5 lg:gap-3.5">
      <div className="relative">
        <Link
          href={`/shop/${product.slug}`}
          className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-orange-100"
        >
          <Image
            src={main}
            alt={`${product.name}, ${product.colour.toLowerCase()}`}
            fill
            sizes={sizes}
            preload={preload}
            className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {sold && <span className="absolute inset-0 bg-orange-50/45" />}
          {second && (
            <Image
              src={second}
              alt=""
              fill
              sizes={sizes}
              className="scale-[1.03] object-cover [clip-path:inset(0_0_0_100%)] transition-[clip-path,scale] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-100 group-hover:[clip-path:inset(0_0_0_0%)] motion-reduce:transition-none max-lg:hidden"
            />
          )}
        </Link>
        {sold ? (
          <span className="pointer-events-none absolute top-[10px] left-2 inline-grid h-6 place-items-center rounded-full bg-stone-900 px-2.5 text-[12px] font-semibold text-orange-50 lg:top-[15px] lg:left-3 lg:h-[31px] lg:px-[11px] lg:text-[13px]">
            Sold
          </span>
        ) : (
          product.kind === "ready" &&
          product.size && (
            <span className="pointer-events-none absolute top-[10px] left-2 lg:top-[15px] lg:left-3">
              <SizeChip size={product.size} />
            </span>
          )
        )}
        <SaveButton slug={product.slug} name={product.name} className="absolute top-2 right-2 lg:top-3 lg:right-3" />
      </div>

      {/* Availability first, then a name that always has room for two lines on phones (so every row lines up), the
          price, and the action pinned to the bottom of the card. */}
      <Link href={`/shop/${product.slug}`} className="flex flex-1 flex-col gap-1">
        <p className={`text-[12px] leading-[1.3] font-semibold lg:text-[13px] ${sold ? "text-stone-500" : product.kind === "ready" ? "text-emerald-800" : "text-amber-800"}`}>
          {sold ? "Sold" : tagLabel(product)}
        </p>
        <h3 className="line-clamp-2 min-h-[2.6em] text-[15px] leading-[1.3] font-medium text-stone-900 lg:min-h-0 lg:text-[17px]">{product.name}</h3>
        <p className={`text-[14px] leading-[1.3] lg:text-[16px] ${sold ? "text-stone-400 line-through" : "text-stone-600"}`}>{priceLabel(product)}</p>
        <span className="card-cta mt-auto pt-2.5 pb-px text-[14px] leading-[1.3] font-semibold text-stone-900 lg:pt-3 lg:text-[15px]">
          {action}
        </span>
      </Link>
    </article>
  );
}
