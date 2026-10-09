import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/product/save-button";
import { SizeChip } from "@/components/product/size-chip";
import { priceLabel, tagLabel, type Product } from "@/lib/products";

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

  return (
    <article className="group relative flex flex-col gap-3 lg:gap-3.5">
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
        {product.kind === "ready" && product.size && (
          <span className="pointer-events-none absolute top-[10px] left-2 lg:top-[15px] lg:left-3">
            <SizeChip size={product.size} />
          </span>
        )}
        <SaveButton slug={product.slug} name={product.name} className="absolute top-2 right-2 lg:top-3 lg:right-3" />
      </div>

      <Link href={`/shop/${product.slug}`} className="flex flex-col gap-1">
        <h3 className="text-[15px] leading-snug font-medium text-stone-900 lg:text-[17px] lg:leading-[1.3]">{product.name}</h3>
        <p className="text-[14px] leading-[1.3] text-stone-600 lg:text-[16px]">{priceLabel(product)}</p>
        <p className={`text-[13px] leading-[1.3] font-semibold ${product.kind === "ready" ? "text-emerald-800" : "text-amber-800"}`}>
          {tagLabel(product)}
        </p>
      </Link>
    </article>
  );
}
