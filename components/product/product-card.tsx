import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/product/save-button";
import { SizeChip } from "@/components/product/size-chip";
import { priceLabel, tagLabel, type Product } from "@/lib/products";

export function ProductCard({
  product,
  compact = false,
  sizes = "(min-width: 1024px) 310px, 50vw",
  preload = false,
}: {
  product: Product;
  compact?: boolean;
  sizes?: string;
  preload?: boolean;
}) {
  const [main, second] = product.images;
  const inset = compact ? "top-2 left-2" : "top-3 left-3";

  return (
    <article className="group relative flex flex-col gap-3 lg:gap-3.5">
      <div className="relative">
        <Link
          href={`/shop/${product.slug}`}
          className="relative block aspect-[3/4] overflow-hidden rounded-[14px] bg-orange-100 lg:rounded-[18px]"
        >
          <Image
            src={main}
            alt={`${product.name}, ${product.colour.toLowerCase()}`}
            fill
            sizes={sizes}
            preload={preload}
            className="object-cover transition-[transform,opacity] duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
          />
          {second && (
            <Image
              src={second}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-lg:hidden"
            />
          )}
        </Link>
        {product.kind === "ready" && product.size && (
          <span className={`absolute ${compact ? "top-[11px] left-2" : "top-[15px] left-3"}`}>
            <SizeChip size={product.size} compact={compact} />
          </span>
        )}
        <SaveButton slug={product.slug} name={product.name} className={`absolute ${inset.replace("left", "right")}`} />
      </div>

      <Link href={`/shop/${product.slug}`} className="flex flex-col gap-1">
        <h3 className={`font-medium text-stone-900 ${compact ? "text-[15px] leading-snug" : "text-[17px] leading-[1.3]"}`}>{product.name}</h3>
        <p className={`text-stone-600 ${compact ? "text-[14px]" : "text-[16px]"} leading-[1.3]`}>{priceLabel(product)}</p>
        <p className={`text-[13px] leading-[1.3] font-semibold ${product.kind === "ready" ? "text-emerald-800" : "text-amber-800"}`}>
          {tagLabel(product)}
        </p>
      </Link>
    </article>
  );
}
