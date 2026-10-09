/* eslint-disable @next/next/no-img-element -- ImageResponse draws plain <img>, not next/image */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ReactNode } from "react";
import sharp from "sharp";

// The picture a chat app shows when someone sends a link to the site (Figma: Foundations > Share cards).
// Every card uses one grid: 56px margin, Mimi's logo top left, the words bottom left, and one 3:4 photo
// on the right with the site's 18px photo corners.

export const shareSize = { width: 1200, height: 630 };
// Sent as JPEG: a 1200x630 PNG with a photo is 350-500KB, and WhatsApp drops previews over ~300KB.
export const shareType = "image/jpeg";
export const INK = "#1c1917";
const CREAM = "#fff7ed";
const PAD = 56;
const PHOTO = { w: 389, h: 518 };
const LOGO = { w: 150, h: 119 };

// Every path below is scoped to its folder, so the build only ships those folders with these routes
// (a fully dynamic path would pull the whole project, videos included, into the server bundle).
const font = (name: string) => readFile(join(process.cwd(), "assets/fonts", name));

// Read once at module scope: the fonts and logo never change between cards.
const [serif, medium, semibold, naira, logoSvg] = await Promise.all([
  font("YoungSerif-Regular.ttf"),
  font("Figtree-Medium.ttf"),
  font("Figtree-SemiBold.ttf"),
  // Neither Young Serif nor Figtree has ₦, so prices borrow it from a static Inter cut (on the site it comes from the system font).
  font("Inter-Naira.ttf"),
  readFile(join(process.cwd(), "public/brand/mimi-logo.svg"), "utf8"),
]);
const logo = `data:image/svg+xml;base64,${Buffer.from(logoSvg.replace(/currentColor/g, INK)).toString("base64")}`;

const fonts = [
  { name: "Young Serif", data: serif, weight: 400 as const, style: "normal" as const },
  { name: "Figtree", data: medium, weight: 500 as const, style: "normal" as const },
  { name: "Figtree", data: semibold, weight: 600 as const, style: "normal" as const },
  { name: "Naira", data: naira, weight: 500 as const, style: "normal" as const },
];

/** A card: `photo` is a product or story photo under public/ (e.g. "/images/products/x-1.jpg"), `children` the words. */
export async function shareCard({ photo, children }: { photo: string; children: ReactNode }) {
  const name = basename(photo);
  const path = photo.startsWith("/images/products/") ? join(process.cwd(), "public/images/products", name) : join(process.cwd(), "public/images/story", name);
  const src = `data:image/jpeg;base64,${(await readFile(path)).toString("base64")}`;
  const png = new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", background: CREAM, color: INK }}>
        <img src={logo} width={LOGO.w} height={LOGO.h} alt="" style={{ position: "absolute", left: PAD, top: PAD }} />
        <img
          src={src}
          width={PHOTO.w}
          height={PHOTO.h}
          alt=""
          style={{ position: "absolute", right: PAD, top: PAD, objectFit: "cover", borderRadius: 18 }}
        />
        {/* the words sit on the photo's bottom edge */}
        <div
          style={{
            position: "absolute",
            left: PAD,
            bottom: PAD - 14,
            width: shareSize.width - PAD * 3 - PHOTO.w,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    ),
    { ...shareSize, fonts },
  );
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": shareType } });
}

/** Young Serif headline type, as on the site (tracking -0.02em, leading 1.04). */
export function serifStyle(size: number) {
  return { fontFamily: "Young Serif", fontSize: size, lineHeight: 1.04, letterSpacing: size * -0.02 };
}
