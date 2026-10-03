import Link from "next/link";
import { footerLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-orange-50">
      <div className="container-page pt-10 pb-12 lg:pt-12 lg:pb-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-0">
          <div className="flex flex-col gap-2.5">
            <p className="font-serif text-[22px] leading-tight lg:text-[28px]">{site.name}</p>
            <p className="hidden text-[15px] text-stone-600 lg:block">Handmade in Port Harcourt, worn all over Nigeria.</p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-[72px]">
            <div className="flex gap-10 lg:gap-[72px]">
              {[footerLinks.shop, footerLinks.studio].map((group, i) => (
                <ul key={i} className="flex flex-col gap-2.5 lg:gap-3">
                  {group.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] font-medium hover:underline hover:underline-offset-4">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-3">
              {footerLinks.social.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] text-stone-600 hover:text-stone-900 lg:text-[15px] lg:font-medium lg:text-stone-900 lg:hover:underline lg:hover:underline-offset-4"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 text-[13px] text-stone-500 lg:mt-10">
          © 2026 {site.name}
          <span className="lg:hidden">. Handmade in Port Harcourt, worn all over Nigeria.</span>
        </p>
      </div>
    </footer>
  );
}
