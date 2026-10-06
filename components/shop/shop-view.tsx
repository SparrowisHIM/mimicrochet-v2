"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { ProductCard } from "@/components/product/product-card";
import { Button, buttonClass } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { Curtain, RevealText } from "@/components/motion/reveal";
import { categories, colourGroups, type ColourGroup } from "@/lib/products";
import { applyFilters, defaultFilters, priceBands, sorts, type ShopFilters } from "@/lib/shop-filter";

const PAGE = 15;

const swatch: Record<ColourGroup, string> = {
  Red: "bg-red-600",
  Pink: "bg-pink-400",
  Yellow: "bg-yellow-400",
  Green: "bg-green-700",
  Blue: "bg-blue-600",
  Purple: "bg-purple-500",
  Black: "bg-stone-900",
  Cream: "bg-amber-50",
};

function HaveItMade() {
  return (
    <div className="flex aspect-[3/4] flex-col justify-between rounded-[14px] bg-stone-900 p-4 text-orange-50 lg:rounded-[18px] lg:p-7">
      <div className="flex flex-col gap-2.5 lg:gap-3.5">
        <p className="font-serif text-[19px] leading-[1.15] lg:text-[30px]">
          <span className="lg:hidden">Not your size?</span>
          <span className="max-lg:hidden">Love it, but not your size?</span>
        </p>
        <p className="text-[13px] leading-[1.45] text-stone-300 lg:text-[16px] lg:leading-[1.5]">
          <span className="lg:hidden">Mimi can make it for you.</span>
          <span className="max-lg:hidden">Mimi can make any piece in your size, or something new from your photo.</span>
        </p>
      </div>
      <Link href="/custom-order" className={buttonClass("light", "sm", "w-full lg:h-[50px] lg:text-[15px]")}>
        <span className="lg:hidden">Start an order</span>
        <span className="max-lg:hidden">Start a custom order</span>
      </Link>
    </div>
  );
}

export function ShopView({ initial }: { initial: Partial<ShopFilters> & { search?: boolean } }) {
  const [f, setF] = useState<ShopFilters>({ ...defaultFilters, ...initial });
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);
  const [searching, setSearching] = useState(Boolean(initial.search || initial.query));
  const set = (patch: Partial<ShopFilters>) => {
    setF((cur) => ({ ...cur, ...patch }));
    setShown(PAGE);
  };

  const results = useMemo(() => applyFilters(f), [f]);
  const visible = results.slice(0, shown);
  const catCount = (c: string) => applyFilters(f, "category").filter((p) => c === "all" || p.category === c).length;
  const typeCount = (t: "ready" | "made") => applyFilters(f, "type").filter((p) => p.kind === t).length;
  const activeExtras = (f.price ? 1 : 0) + f.colours.length + (f.sort !== "newest" ? 1 : 0);

  const categoryChips = (
    <>
      <Chip on={f.category === "all"} onClick={() => set({ category: "all" })}>
        All · {catCount("all")}
      </Chip>
      {categories.map((c) => (
        <Chip key={c} on={f.category === c} onClick={() => set({ category: f.category === c ? "all" : c })}>
          {c} · {catCount(c)}
        </Chip>
      ))}
    </>
  );

  // Grid with the "Have it made" tile after the fifth piece, like a product.
  const cells: ({ kind: "tile" } | { kind: "product"; i: number })[] = visible.map((_, i) => ({ kind: "product" as const, i }));
  if (visible.length >= 5) cells.splice(5, 0, { kind: "tile" });

  return (
    <>
      <div className="container-page flex flex-col gap-5 pt-6 pb-4 lg:flex-row lg:items-end lg:justify-between lg:pt-11 lg:pb-5">
        <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-start lg:gap-2.5">
          <RevealText as="h1" immediate text="Shop" className="font-serif text-[40px] leading-none tracking-[-0.02em] lg:text-[56px]" />
          <p className="text-[15px] text-stone-600 lg:text-[17px]">
            <span className="lg:hidden">{results.length} pieces</span>
            <span className="max-lg:hidden">One-of-one pieces ready to wear, and pieces Mimi makes for you in your size.</span>
          </p>
        </div>
        <div className="hidden items-center gap-7 lg:flex">
          <Toggle id="shop-ready" label="Ready to wear only" checked={f.type === "ready"} onChange={(v) => set({ type: v ? "ready" : "all" })} />
          <label className="flex items-center gap-1.5 text-[15px]">
            <span className="text-stone-500">Sort:</span>
            <select
              value={f.sort}
              onChange={(e) => set({ sort: e.target.value as ShopFilters["sort"] })}
              className="cursor-pointer appearance-none bg-transparent pr-1 font-medium focus-visible:outline-2"
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setSearching((v) => !v)} className="grid size-10 place-items-center rounded-full hover:bg-orange-100" aria-label="Search the shop">
            <SearchIcon />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {searching && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="container-page pb-4">
              <label className="flex h-12 items-center gap-3 rounded-full border border-stone-300 bg-white px-4 focus-within:border-stone-900">
                <SearchIcon size={20} className="text-stone-500" />
                <input
                  autoFocus
                  value={f.query}
                  onChange={(e) => set({ query: e.target.value })}
                  placeholder="Search pieces, colours…"
                  className="h-full flex-1 bg-transparent text-[16px] outline-none placeholder:text-stone-400"
                  aria-label="Search pieces"
                />
                {f.query && (
                  <button type="button" onClick={() => set({ query: "" })} aria-label="Clear search">
                    <CloseIcon size={18} />
                  </button>
                )}
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 lg:container-page lg:items-center lg:justify-between lg:overflow-visible">
        <div className="flex gap-2">{categoryChips}</div>
        <div className="hidden lg:block">
          <Button variant="secondary" size="sm" className="h-11 px-[18px] text-[15px]" onClick={() => setSheet(true)}>
            Price & colour{activeExtras ? ` (${activeExtras})` : ""}
          </Button>
        </div>
      </div>

      <div className="container-page flex items-center justify-between py-4 lg:hidden">
        <Toggle id="shop-ready-m" label="Ready to wear only" checked={f.type === "ready"} onChange={(v) => set({ type: v ? "ready" : "all" })} />
        <Button variant="secondary" size="sm" className="h-[38px] px-4" onClick={() => setSheet(true)}>
          Filters & sort{activeExtras ? ` (${activeExtras})` : ""}
        </Button>
      </div>

      <section className="container-page pt-2 pb-6 lg:pt-7" aria-label="Pieces">
        {results.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-[22px] bg-white p-8 lg:p-12">
            <p className="font-serif text-[28px] leading-tight">Nothing matches that yet.</p>
            <p className="max-w-[460px] text-[16px] text-stone-600">Clear a filter, or ask Mimi to make exactly what you have in mind.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => set(defaultFilters)}>
                Clear filters
              </Button>
              <Link href="/custom-order" className={buttonClass("primary")}>
                Start a custom order
              </Link>
            </div>
          </div>
        ) : (
          <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-7 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-11">
            <AnimatePresence mode="popLayout" initial={false}>
              {cells.map((c) =>
                c.kind === "tile" ? (
                  <motion.li key="tile" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <HaveItMade />
                  </motion.li>
                ) : (
                  <motion.li
                    key={visible[c.i].slug}
                    layout
                    exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Curtain index={c.i}>
                      <ProductCard product={visible[c.i]} preload={c.i < 4} />
                    </Curtain>
                  </motion.li>
                ),
              )}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>

      {results.length > 0 && (
        <div className="flex flex-col items-center gap-3 px-5 pt-8 pb-16 lg:pt-14 lg:pb-24">
          <p className="text-[15px] text-stone-600">
            Showing {visible.length} of {results.length}
          </p>
          <span className="h-1 w-[180px] overflow-hidden rounded-full bg-stone-200 lg:w-[220px]" aria-hidden>
            <motion.span
              className="block h-full origin-left rounded-full bg-stone-900"
              animate={{ scaleX: visible.length / results.length }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          {visible.length < results.length && (
            <Button variant="secondary" className="mt-1 max-sm:w-full" onClick={() => setShown((n) => n + PAGE + 1)}>
              Show more
            </Button>
          )}
        </div>
      )}

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters & sort"
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="px-5" onClick={() => set({ ...defaultFilters, query: f.query })}>
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => setSheet(false)}>
              Show {results.length} {results.length === 1 ? "piece" : "pieces"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-[15px] font-semibold">Type</legend>
            <div className="flex flex-wrap gap-2">
              <Chip on={f.type === "ready"} onClick={() => set({ type: f.type === "ready" ? "all" : "ready" })}>
                Ready to wear · {typeCount("ready")}
              </Chip>
              <Chip on={f.type === "made"} onClick={() => set({ type: f.type === "made" ? "all" : "made" })}>
                Made to order · {typeCount("made")}
              </Chip>
            </div>
          </fieldset>
          <fieldset className="flex flex-col">
            <legend className="mb-2.5 text-[15px] font-semibold">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Chip key={c} on={f.category === c} onClick={() => set({ category: f.category === c ? "all" : c })}>
                  {c} · {catCount(c)}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col">
            <legend className="mb-2.5 text-[15px] font-semibold">Price</legend>
            <div className="flex flex-wrap gap-2">
              {priceBands.map((b) => (
                <Chip key={b.key} on={f.price === b.key} onClick={() => set({ price: f.price === b.key ? null : b.key })}>
                  {b.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col">
            <legend className="mb-2.5 text-[15px] font-semibold">Colour</legend>
            <div className="grid grid-cols-8 gap-y-3">
              {colourGroups.map((c) => {
                const on = f.colours.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ colours: on ? f.colours.filter((x) => x !== c) : [...f.colours, c] })}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className={`grid size-9 place-items-center rounded-full transition-shadow ${on ? "ring-2 ring-stone-900 ring-offset-2 ring-offset-orange-50" : ""}`}>
                      <span className={`size-7 rounded-full border border-stone-300 ${swatch[c]}`} />
                    </span>
                    <span className={`text-[11px] ${on ? "font-semibold text-stone-900" : "text-stone-500"}`}>{c}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="flex flex-col">
            <legend className="mb-2.5 text-[15px] font-semibold">Sort</legend>
            <div className="flex flex-wrap gap-2">
              {sorts.map((s) => (
                <Chip key={s.key} on={f.sort === s.key} onClick={() => set({ sort: s.key })}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      </Sheet>
    </>
  );
}

