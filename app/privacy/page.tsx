import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons";
import { linkClass } from "@/components/ui/button";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Mimi uses your details, in plain words: what she keeps, why, who else sees it, and how long.",
};

// Nigeria's Data Protection Act 2023 asks a business to say, plainly, what it collects and why, who it
// shares it with, how long it keeps it, and how people can ask for it back. Every line here matches what
// the site actually does (lib/server: photos and voice notes deleted 2 months after delivery; Paystack
// takes payments; the bag, saved pieces and fit stay in the customer's browser).

/** "2349157669182" → "+234 915 766 9182" */
const phone = (n: string) => `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;

const inShort = [
  "Your details are only used to make and deliver your order.",
  "Paystack takes your payment. Mimi never sees your card.",
  "Your photos and voice notes are deleted 2 months after delivery.",
  "Nothing is sold, and there are no ads or trackers.",
];

const reach = (
  <>
    Reach her on WhatsApp at{" "}
    <a href={whatsappLink()} target="_blank" rel="noreferrer" className="font-medium whitespace-nowrap text-stone-900 underline underline-offset-4 hover:decoration-2">
      {phone(site.whatsappNumber)}
    </a>{" "}
    or by email at{" "}
    <a href={`mailto:${site.email}`} className="font-medium [overflow-wrap:anywhere] text-stone-900 underline underline-offset-4 hover:decoration-2">
      {site.email}
    </a>
    .
  </>
);

/** Each section: a heading, then paragraphs; lines starting with "•" are a list. */
const sections: { title: string; body: React.ReactNode[] }[] = [
  { title: "Who looks after your details", body: [<>Mimicrochet is Mimi’s crochet studio in Nigeria. Mimi looks after the details you share here. {reach}</>] },
  {
    title: "What Mimi keeps",
    body: [
      "• Your name, WhatsApp number and delivery address, so she can reach you and the rider can find you.",
      "• Your email, when you pay online, for your Paystack receipt.",
      "• For a custom order, the photos, voice note, measurements and notes you choose to send.",
      "• What you ordered, what you paid and how your order is going.",
      "Your bag, saved pieces and saved fit stay on your own phone until you send an order.",
    ],
  },
  { title: "Why", body: ["To price, make and deliver your order, keep your order page up to date, and answer your questions. Nothing else."] },
  {
    title: "Who else sees them",
    body: [
      "• Paystack takes your payment. Your card or bank details go straight to them, never to Mimi or this site.",
      "• The rider gets your name, number and address, only to deliver your order.",
      "• The services that run this site store it safely: Netlify (the site and your files), Neon (the order records) and Cloudflare (to load the site quickly).",
      "Mimi never sells your details or shares them for advertising.",
    ],
  },
  {
    title: "How long they’re kept",
    body: ["Your photos and voice notes are deleted 2 months after your order is delivered. The order record (what you bought, the amount, your name and delivery area) stays in Mimi’s business records."],
  },
  {
    title: "Your rights",
    body: [
      <>
        Under Nigeria’s Data Protection Act 2023, you can ask Mimi what she holds about you, ask her to correct or delete it, and take back your OK for any photo you shared. Message her on WhatsApp or by email. If
        you’re unhappy with how your details were handled, you can complain to the Nigeria Data Protection Commission at{" "}
        <a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" className="font-medium text-stone-900 underline underline-offset-4 hover:decoration-2">
          ndpc.gov.ng
        </a>
        .
      </>,
    ],
  },
  {
    title: "Keeping your order private",
    body: ["Your order page has its own private link. Keep it to yourself: anyone with it can see your order. Mimi’s order list is behind a password, and everything on this site travels encrypted."],
  },
  { title: "Customers on this site", body: ["The customers shown wearing Mimi’s pieces agreed to it. If you’d like a photo of you taken down, tell Mimi and she’ll remove it."] },
];

/** Turns a section's lines into paragraphs, grouping "•" lines into one list. */
function Body({ lines }: { lines: React.ReactNode[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    out.push(
      <ul key={`l${out.length}`} className="flex flex-col gap-2.5">
        {list.map((l) => (
          <li key={l} className="flex gap-2.5">
            <span aria-hidden>•</span>
            <span>{l.slice(2)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };
  lines.forEach((l, i) => {
    if (typeof l === "string" && l.startsWith("• ")) return void list.push(l);
    flush();
    out.push(<p key={i}>{l}</p>);
  });
  flush();
  return <div className="flex flex-col gap-2.5 text-[16px] leading-[1.55] text-stone-600">{out}</div>;
}

export default function PrivacyPage() {
  return (
    <div className="container-page flex flex-col gap-7 pt-8 pb-14 lg:flex-row lg:items-start lg:gap-[120px] lg:pt-20 lg:pb-28">
      <aside className="flex flex-col gap-7 lg:sticky lg:top-28 lg:w-[400px] lg:shrink-0">
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] lg:text-[56px]">Privacy</h1>
          <p className="text-[17px] leading-[1.5] text-stone-600">How Mimi uses your details, in plain words.</p>
          <p className="text-[14px] text-stone-500">Last updated 11 October 2026</p>
        </div>
        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-5 lg:p-6" aria-label="In short">
          <h2 className="text-[16px] font-semibold">In short</h2>
          <ul className="flex flex-col gap-3">
            {inShort.map((line) => (
              <li key={line} className="flex gap-2.5 text-[15px] leading-[1.45] text-stone-700">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="none" className="mt-[3px] shrink-0 text-emerald-700" aria-hidden>
                  <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {line}
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div className="flex flex-col gap-9 pt-2 lg:max-w-[720px] lg:pt-0">
        {sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-2.5">
            <h2 className="font-serif text-[24px] leading-[1.2] lg:text-[28px]">{s.title}</h2>
            <Body lines={s.body} />
          </section>
        ))}
        <div className="flex flex-col items-start gap-2.5 border-t border-stone-200 pt-6">
          <p className="text-[16px] font-semibold">Questions about your details?</p>
          <a href={whatsappLink("Hi Mimi! I have a question about my details on your site.")} target="_blank" rel="noreferrer" className={linkClass}>
            <WhatsAppIcon size={18} /> Ask Mimi
          </a>
        </div>
      </div>
    </div>
  );
}
