"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { bagUi } from "@/lib/bag";
import { bagStore, savedStore } from "@/lib/local-store";
import { navLinks, site } from "@/lib/site";

function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 22 }}
          className="absolute top-0.5 right-0 grid size-[18px] place-items-center rounded-full border-[1.5px] border-orange-50 bg-stone-900 text-[10px] leading-none font-bold text-orange-50"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const iconButton =
  "relative grid size-[38px] place-items-center rounded-full text-stone-900 transition-colors hover:bg-orange-100 lg:size-10";

export function Header() {
  const pathname = usePathname();
  const saved = savedStore.useList();
  const bag = bagStore.useList();
  const [menuOpen, setMenuOpen] = useState(false);
  // Any page change closes the menu, including the logo, the header icons and the back button.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-orange-50/92 backdrop-blur-md">
      <div className="container-page flex h-[62px] items-center justify-between lg:h-[72px]">
        <div className="flex items-center lg:w-[280px]">
          <Link
            href="/"
            onClick={closeMenu}
            className="font-serif text-[19px] tracking-[-0.01em] text-stone-900 max-[380px]:text-[15px] lg:text-[22px]"
            aria-label={`${site.name}, home`}
          >
            {site.name}
          </Link>
        </div>

        <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="group relative text-[15px] font-medium text-stone-900"
              >
                {link.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-[1.5px] w-full origin-left bg-stone-900 transition-transform duration-300 ease-[var(--ease-out-soft)] ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end lg:w-[280px] lg:gap-3">
          <Link href="/shop?search=1" onClick={closeMenu} className={iconButton} aria-label="Search the shop">
            <SearchIcon />
          </Link>
          <Link href="/saved" onClick={closeMenu} className={`${iconButton} max-[380px]:hidden`} aria-label={`Saved pieces, ${saved.length}`}>
            <HeartIcon />
            <CountBadge count={saved.length} />
          </Link>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              bagUi.open();
            }}
            className={iconButton}
            aria-label={`Your bag, ${bag.length} pieces`}
          >
            <BagIcon />
            <CountBadge count={bag.length} />
          </button>
          <button
            type="button"
            className={`${iconButton} lg:hidden`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-62px)] border-t border-stone-200/70 bg-orange-50 px-5 pt-6 lg:hidden"
          >
            <ul className="flex flex-col">
              {[...navLinks, { href: "/saved", label: "Saved pieces" }, { href: "/contact", label: "Contact" }].map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-stone-200 py-4 font-serif text-[30px] leading-tight"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
