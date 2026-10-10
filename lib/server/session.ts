import "server-only";
import { createHmac, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Mimi's sign-in for her studio. One password, set with `npm run studio:setup`, stored only as a scrypt
// hash (STUDIO_PASSWORD_HASH). Signing in gives her phone a signed cookie for 90 days, so she signs in
// once per phone. Changing SESSION_SECRET signs every phone out.

const COOKIE = "mimi_studio";
const DAYS = 90;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is not set");
  return s;
}

const sign = (expires: number) => createHmac("sha256", secret()).update(`studio.${expires}`).digest("base64url");

function scryptAsync(password: string, salt: Buffer, n: number, r: number, p: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 32, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (e, key) => (e ? reject(e) : resolve(key))),
  );
}

/** Checks the password against STUDIO_PASSWORD_HASH ("scrypt:N:r:p:salt:hash", base64). */
export async function passwordMatches(password: string) {
  const stored = process.env.STUDIO_PASSWORD_HASH ?? "";
  const [kind, n, r, p, salt, hash] = stored.split(":");
  if (kind !== "scrypt" || !salt || !hash || password.length === 0 || password.length > 200) return false;
  const key = await scryptAsync(password, Buffer.from(salt, "base64"), Number(n), Number(r), Number(p));
  const want = Buffer.from(hash, "base64");
  return key.length === want.length && timingSafeEqual(key, want);
}

export async function startSession() {
  const expires = Math.floor(Date.now() / 1000) + DAYS * 86_400;
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 86_400,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Whether the studio's sign-in has been set up on this site (npm run studio:setup, then Netlify's settings). */
export const studioReady = () => Boolean(process.env.STUDIO_PASSWORD_HASH && (process.env.SESSION_SECRET?.length ?? 0) >= 32);

/** Whether this request comes from Mimi's signed-in phone. */
export async function isStudio() {
  if (!studioReady()) return false;
  const value = (await cookies()).get(COOKIE)?.value ?? "";
  const [exp, sig] = value.split(".");
  const expires = Number(exp);
  if (!sig || !Number.isInteger(expires) || expires < Date.now() / 1000) return false;
  try {
    const want = Buffer.from(sign(expires));
    const got = Buffer.from(sig);
    return want.length === got.length && timingSafeEqual(want, got);
  } catch {
    return false;
  }
}

/** For every studio action: stops anything not from Mimi's signed-in phone. */
export async function requireStudio() {
  if (!(await isStudio())) throw new Error("Not signed in");
}
