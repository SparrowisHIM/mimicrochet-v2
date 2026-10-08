"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { RulerIcon, WhatsAppIcon } from "@/components/icons";
import { SaveButton } from "@/components/product/save-button";
import { Button, ButtonLink, buttonClass, linkClass } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { addToBag, bagUi } from "@/lib/bag";
import { bagStore } from "@/lib/local-store";
import { priceLabel, tagLabel, type Product } from "@/lib/products";
import { hasSizes, sizeChart, sizeLabels, stockLine } from "@/lib/sizes";
import { whatsappLink } from "@/lib/site";
import { stages } from "@/lib/stages";

const ease = [0.22, 1, 0.36, 1] as const;

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-stone-200">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-[18px] text-left text-[16px] font-semibold">
        {title}
        <span className="relative size-4" aria-hidden>
          <span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-stone-900" />
          <motion.span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-stone-900" animate={{ rotate: open ? 0 : 90 }} transition={{ duration: 0.3, ease }} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <div className="pb-[18px] text-[15px] leading-[1.55] text-stone-600">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MadeForYou({ product }: { product: Product }) {
  const quick = Boolean(product.leadTime);
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-orange-200 bg-white px-[22px] py-5">
      <div className="flex items-center justify-between">
        <span className="text-[16px] font-semibold">Made for you</span>
        <span className="text-[14px] font-semibold text-amber-800">{quick ? "About 3 days" : "About 3 weeks"}</span>
      </div>
      <p className="text-[15px] leading-[1.5] text-stone-600">
        {quick
          ? "Mimi makes this pair when you order. It’s at your door within a week. You pay now and get a tracking link."
          : product.price === null
            ? "Tell Mimi your size and colours. She confirms the price and the date with you on WhatsApp before she starts, and you follow every step with your own tracking link."
            : "You choose the size and colours. Mimi confirms the final price with you on WhatsApp before she starts, and you can follow every step with your own tracking link."}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {stages.map((s, i) => (
          <span key={s.key} className={`h-1 flex-1 rounded-full ${i === 0 ? "bg-amber-800" : "bg-stone-100"}`} />
        ))}
      </div>
      <p className="text-[13px] font-medium text-stone-500">{stages.map((s) => s.label).join("  →  ")}</p>
    </div>
  );
}

export function ProductView({ product }: { product: Product }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const sized = hasSizes(product);
  const stockSize = product.kind === "ready" ? product.size : undefined;
  const [size, setSize] = useState<string | null>(stockSize && sized ? stockSize : null);
  const [guide, setGuide] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const inBag = bagStore.useList().includes(product.slug);

  const otherSize = Boolean(stockSize && size && size !== stockSize);
  const buyable = product.checkout === "bag" && !otherSize;
  const requestHref = `/custom-order?piece=${product.slug}${size ? `&size=${size}` : ""}`;
  const ask = whatsappLink(`Hi Mimi! I’m looking at the ${product.name} (${priceLabel(product)}). Is it still available?`);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    // The top margin is the sticky header, so the bar arrives as the buttons slide under it.
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting && e.boundingClientRect.top < 62), { threshold: 0, rootMargin: "-62px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onStripScroll = () => {
    const el = strip.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const primary = buyable ? (
    inBag ? (
      <Button className="w-full" onClick={() => bagUi.open()}>
        In your bag · View bag
      </Button>
    ) : (
      <Button className="w-full" onClick={() => addToBag(product.slug)}>
        Add to bag
      </Button>
    )
  ) : (
    <ButtonLink href={requestHref} className="w-full">
      {otherSize ? `Request in size ${size}` : "Request this piece"}
    </ButtonLink>
  );

  return (
    <>
      {/* data-floating-bar: globals.css leaves room under the footer for the phone buy bar. */}
      <div className="lg:container-page lg:pt-7" data-floating-bar>
        <nav aria-label="Breadcrumb" className="hidden text-[14px] text-stone-500 lg:block">
          <Link href="/shop" className="hover:text-stone-900">
            Shop
          </Link>
          <span className="px-2">/</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-stone-900">
            {product.category}
          </Link>
          <span className="px-2">/</span>
          <span className="text-stone-900">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:mt-7 lg:flex-row lg:gap-[72px] lg:pb-28">
          {/* Gallery */}
          <div className="lg:flex lg:w-[704px] lg:shrink-0 lg:gap-4">
            {product.images.length > 1 && (
              <div className="hidden w-[88px] shrink-0 flex-col gap-3 lg:flex">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Photo ${i + 1}`}
                    aria-current={i === index}
                    className={`relative aspect-[3/4] overflow-hidden rounded-[12px] transition-shadow ${i === index ? "ring-[1.5px] ring-stone-900" : "opacity-80 hover:opacity-100"}`}
                  >
                    <Image src={src} alt="" fill sizes="88px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className={`relative lg:flex-1 ${product.images.length > 1 ? "" : "lg:ml-[104px]"}`}>
              {/* desktop main photo */}
              <div className="relative hidden aspect-[3/4] overflow-hidden rounded-[24px] bg-orange-100 lg:block">
                <AnimatePresence initial={false}>
                  <motion.div key={product.images[index]} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <Image src={product.images[index]} alt={`${product.name}, ${product.colour.toLowerCase()}`} fill preload sizes="600px" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* phone swipe strip */}
              <div ref={strip} onScroll={onStripScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden">
                {product.images.map((src, i) => (
                  <div key={src} className="relative aspect-[3/4] max-h-[78svh] w-full shrink-0 snap-center bg-orange-100">
                    <Image src={src} alt={i === 0 ? `${product.name}, ${product.colour.toLowerCase()}` : ""} fill preload={i === 0} sizes="100vw" className="object-cover" />
                  </div>
                ))}
              </div>
              {product.images.length > 1 && (
                <span className="absolute right-4 bottom-4 rounded-full bg-white/92 px-3 py-1 text-[13px] font-semibold tabular-nums lg:hidden">
                  {index + 1} / {product.images.length}
                </span>
              )}
              <SaveButton slug={product.slug} name={product.name} size="lg" className="absolute top-4 right-4" />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-7 px-5 pt-6 pb-16 lg:w-[536px] lg:px-0 lg:pt-2 lg:pb-0">
            <motion.div
              className="flex flex-col gap-3"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
            >
              <p className={`text-[14px] font-semibold ${product.kind === "ready" ? "text-emerald-800" : "text-amber-800"}`}>{tagLabel(product)}</p>
              <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.01em] lg:text-[44px]">{product.name}</h1>
              <p className="text-[20px] font-medium lg:text-[24px]">{priceLabel(product)}</p>
              <p className="text-[16px] leading-[1.55] text-stone-600 lg:text-[17px]">{product.description}</p>
            </motion.div>

            {product.kind === "made" && <MadeForYou product={product} />}

            {sized && (
              <div className="flex flex-col gap-3.5 border-t border-stone-200 pt-7">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold">Size{product.kind === "made" ? " (you can change it later)" : ""}</span>
                  <button type="button" onClick={() => setGuide(true)} className="group -my-2 inline-flex items-center gap-1.5 py-2 text-[15px] font-medium">
                    <RulerIcon size={18} className="text-stone-500 transition-[color,transform] duration-200 ease-out group-hover:-rotate-6 group-hover:text-stone-900" />
                    <span className="underline decoration-stone-900/30 decoration-[1.5px] underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-stone-900">Size guide</span>
                  </button>
                </div>
                <div className="flex gap-2" role="radiogroup" aria-label="Size">
                  {sizeLabels.map((s, i) => {
                    const on = size === s;
                    const from = stockSize ? sizeLabels.indexOf(stockSize as (typeof sizeLabels)[number]) : 2;
                    return (
                      <motion.button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSize(on && !stockSize ? null : s)}
                        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease, delay: 0.25 + Math.abs(i - from) * 0.05 }}
                        whileTap={{ scale: 0.94 }}
                        className={`h-12 flex-1 rounded-[12px] text-[15px] font-medium transition-colors lg:w-16 lg:flex-none ${
                          on ? "bg-stone-900 text-orange-50" : "border border-stone-300 bg-white hover:border-stone-900"
                        }`}
                      >
                        {s}
                      </motion.button>
                    );
                  })}
                </div>
                {stockSize && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={otherSize ? "other" : "stock"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="flex flex-col gap-1.5">
                      <p className="flex items-center gap-2.5 text-[15px] font-medium">
                        <span className={`size-2 rounded-full ${otherSize ? "bg-amber-600" : "bg-emerald-600"}`} />
                        {otherSize ? `${size} is made for you, in about 3 weeks` : stockLine(stockSize)}
                      </p>
                      <p className="text-[14px] text-stone-500">
                        {otherSize ? `Only ${stockSize} is in stock right now. Mimi confirms the price on WhatsApp before she starts.` : "Other sizes are made for you, in about 3 weeks."}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {!sized && product.kind === "ready" && (
              <p className="flex items-center gap-2.5 border-t border-stone-200 pt-7 text-[15px] font-medium">
                <span className="size-2 rounded-full bg-emerald-600" />
                One size, ready to send
              </p>
            )}

            <div ref={actionsRef} className="flex flex-col gap-3">
              {primary}
              <a href={ask} target="_blank" rel="noreferrer" className={`${linkClass} self-center`}>
                <WhatsAppIcon size={18} /> Ask Mimi on WhatsApp
              </a>
            </div>

            <ul className="flex flex-col gap-2.5 text-[15px] text-stone-600">
              <li>Handmade by Mimi in Port Harcourt</li>
              <li>Delivery anywhere in Nigeria. You pay the rider on arrival.</li>
              <li>
                {product.kind === "ready" ? "Want it in another colour? " : "Have something else in mind? "}
                <Link href="/custom-order" className="text-stone-900 underline underline-offset-4">
                  Start a custom order
                </Link>
              </li>
            </ul>

            <div className="border-b border-stone-200">
              <Accordion title="Details" defaultOpen>
                Colour: {product.colour.toLowerCase()}. {product.description} Crocheted by hand in soft cotton yarn.
              </Accordion>
              {sized && (
                <Accordion title="Size & fit">
                  {stockSize
                    ? `This piece is size ${stockSize}. Crochet stretches a little. Between sizes? Ask Mimi on WhatsApp.`
                    : "Pick your usual size, or add your own measurements when you request it. Mimi makes it to what you give her."}{" "}
                  <button type="button" onClick={() => setGuide(true)} className="text-stone-900 underline underline-offset-4">
                    See the size guide
                  </button>
                </Accordion>
              )}
              <Accordion title="Care">Hand wash cold with a mild soap. Don’t wring it: roll it in a towel and dry it flat in the shade so it keeps its shape.</Accordion>
              <Accordion title="Delivery">
                {product.kind === "ready"
                  ? "Mimi packs ready pieces within 2 days and passes your number to a rider. You pay the rider when it arrives, anywhere in Nigeria."
                  : "When it’s ready, Mimi passes your number to a rider. You pay the rider when it arrives, anywhere in Nigeria."}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Phone: floating bar once the main button scrolls away */}
      <AnimatePresence>
        {barVisible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-full bg-white p-1.5 pl-1.5 shadow-[0_12px_40px_rgb(28_25_23/0.22)] lg:hidden"
          >
            <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-orange-100">
              <Image src={product.images[0]} alt="" fill sizes="44px" className="object-cover" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[14px] font-semibold">{product.name}</span>
              <span className="text-[13px] text-stone-600">
                {priceLabel(product)}
                {stockSize && !otherSize ? ` · ${stockSize}` : ""}
              </span>
            </span>
            {buyable ? (
              <Button size="sm" className="h-11 px-5" onClick={() => (inBag ? bagUi.open() : addToBag(product.slug))}>
                {inBag ? "View bag" : "Add to bag"}
              </Button>
            ) : (
              <Link href={requestHref} className={buttonClass("primary", "sm", "h-11 px-5")}>
                Request
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={guide} onClose={() => setGuide(false)} title="Size guide">
        <p className="text-[15px] text-stone-600">Body measurements each size fits, in centimetres.</p>
        <div className="mt-4 overflow-hidden rounded-[18px] bg-white">
          <table className="w-full text-left text-[15px]">
            <thead className="text-stone-500">
              <tr>
                {["Size", "UK", "Bust", "Waist", "Hips"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((r) => (
                <tr key={r.size} className={`border-t border-stone-100 ${r.size === stockSize ? "bg-emerald-50 font-semibold" : ""}`}>
                  <td className="px-4 py-3">{r.size}</td>
                  <td className="px-4 py-3">{r.uk}</td>
                  <td className="px-4 py-3">{r.bust} cm</td>
                  <td className="px-4 py-3">{r.waist} cm</td>
                  <td className="px-4 py-3">{r.hips} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[14px] text-stone-500">Crochet stretches a little. Between sizes? Ask Mimi on WhatsApp.</p>
      </Sheet>
    </>
  );
}
