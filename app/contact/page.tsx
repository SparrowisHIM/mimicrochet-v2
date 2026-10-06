import type { Metadata } from "next";
import { Faq } from "@/components/contact/faq";
import { ArrowUpRightIcon, ChevronIcon, WhatsAppIcon } from "@/components/icons";
import { TrackForm } from "@/components/order/track-form";
import { RevealText } from "@/components/motion/reveal";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Mimi on WhatsApp about a piece, your size, or that idea in your head.",
};

const questions = ["Is this piece still available?", "Can you make this in my size?", "How much for a custom piece?", "Where’s my order?"];

export default function ContactPage() {
  return (
    <>
      <section className="container-page flex flex-col gap-10 pt-8 pb-14 lg:flex-row lg:items-center lg:justify-between lg:pt-16 lg:pb-20">
        <div className="flex max-w-[560px] flex-col gap-5">
          <RevealText as="h1" immediate text="Talk to Mimi." className="font-serif text-[48px] leading-none tracking-[-0.02em] lg:text-[72px]" />
          <p className="text-[17px] leading-[1.55] text-stone-600 lg:text-[20px]">Ask about a piece, your size, or that idea in your head. WhatsApp is the fastest way, and she usually replies the same day.</p>
        </div>
        <div className="flex w-full flex-col gap-4 rounded-[28px] bg-stone-900 p-5 text-orange-50 lg:w-[560px] lg:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-stone-900">
              <WhatsAppIcon size={20} />
            </span>
            <span className="flex flex-col">
              <span className="font-serif text-[22px] leading-tight lg:text-[24px]">Chat on WhatsApp</span>
              <span className="text-[13px] text-stone-400">Tap a question to start. It’s already typed for you.</span>
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {questions.map((q) => (
              <li key={q}>
                <a href={whatsappLink(`Hi Mimi! ${q}`)} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-[14px] border border-white/15 bg-white/5 px-4 py-3.5 text-[16px] transition-colors hover:border-white/40 hover:bg-white/10">
                  {q}
                  <ChevronIcon size={18} className="text-amber-300 transition-transform group-hover:translate-x-1" />
                </a>
              </li>
            ))}
          </ul>
          <a href={site.socials.whatsapp} target="_blank" rel="noreferrer" className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-orange-50 text-[16px] font-semibold text-stone-900 transition-colors hover:bg-white">
            <WhatsAppIcon size={18} /> Or write your own message
          </a>
        </div>
      </section>

      <section className="container-page grid gap-4 pb-16 lg:grid-cols-3 lg:gap-6 lg:pb-24">
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-[24px]">Track an order</h2>
          <p className="text-[15px] text-stone-600">Already ordered? Pop in your order number.</p>
          <TrackForm compact />
        </div>
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-[24px]">Follow along</h2>
          <p className="text-[15px] text-stone-600">New drops, behind-the-stitch videos and customers in their pieces.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
            {(["instagram", "tiktok", "facebook", "pinterest"] as const).map((k) => (
              <li key={k}>
                <a href={site.socials[k]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[15px] font-medium underline underline-offset-4">
                  {k === "tiktok" ? "TikTok" : k[0].toUpperCase() + k.slice(1)}
                  <ArrowUpRightIcon size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 rounded-[22px] border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-[24px]">Email</h2>
          <p className="text-[15px] text-stone-600">For collaborations, styling and press.</p>
          <a href={`mailto:${site.email}`} className="pt-2 text-[15px] font-medium break-all underline underline-offset-4">
            {site.email}
          </a>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="container-page flex flex-col gap-8 lg:flex-row lg:gap-20">
          <div className="flex flex-col gap-3 lg:w-[360px] lg:shrink-0">
            <h2 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] lg:text-[48px]">Before you ask</h2>
            <p className="text-[16px] text-stone-600 lg:text-[17px]">The questions Mimi answers most, answered once.</p>
          </div>
          <div className="flex-1">
            <Faq />
          </div>
        </div>
      </section>
    </>
  );
}
