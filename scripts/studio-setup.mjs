// One-time setup for Mimi's studio. Run it yourself in a terminal:   npm run studio:setup
// It asks for the studio password (typing stays hidden), then makes:
//   STUDIO_PASSWORD_HASH  the password, scrambled with scrypt (the password itself is never stored)
//   SESSION_SECRET        signs the "signed in" cookie (changing it signs every phone out)
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY   the keys for notifications on Mimi's phones
// It writes them into .env.local (for this computer) and prints them once so you can paste them into
// Netlify: Project configuration > Environment variables, each one marked "Contains secret values".
// Run it again to change the password (it keeps the existing notification keys unless you add --new-keys).
import { randomBytes, scrypt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import webpush from "web-push";

const ENV = new URL("../.env.local", import.meta.url);

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide what's typed: echo nothing but the question.
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(question); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}

const hash = (password) =>
  new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    const [N, r, p] = [32768, 8, 1];
    scrypt(password, salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 }, (e, key) =>
      e ? reject(e) : resolve(`scrypt:${N}:${r}:${p}:${salt.toString("base64")}:${key.toString("base64")}`),
    );
  });

const password = await ask("Studio password for Mimi (at least 10 characters): ");
if (password.length < 10) { console.error("Too short. Use at least 10 characters (a short sentence is easiest to remember)."); process.exit(1); }
if ((await ask("Type it again: ")) !== password) { console.error("The two didn't match. Nothing was changed."); process.exit(1); }

const current = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
const has = (k) => new RegExp(`^${k}=.+$`, "m").test(current);
const keys = has("VAPID_PUBLIC_KEY") && !process.argv.includes("--new-keys") ? null : webpush.generateVAPIDKeys();

const values = {
  STUDIO_PASSWORD_HASH: await hash(password),
  SESSION_SECRET: randomBytes(32).toString("base64url"),
  ...(keys ? { VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey } : {}),
};

let next = current;
for (const [k, v] of Object.entries(values)) {
  const line = `${k}=${v}`;
  next = new RegExp(`^${k}=.*$`, "m").test(next) ? next.replace(new RegExp(`^${k}=.*$`, "m"), line) : `${next.replace(/\n?$/, "\n")}${line}\n`;
}
writeFileSync(ENV, next);

console.log("\nSaved in .env.local. Now add these in Netlify (Project configuration > Environment variables),");
console.log("each as its own variable, with \"Contains secret values\" ticked, the same value in Production, Deploy Previews and Branch deploys:\n");
for (const [k, v] of Object.entries(values)) console.log(`${k}\n${v}\n`);
if (!keys) console.log("(The notification keys already exist in .env.local and weren't changed. If Netlify doesn't have them yet, copy VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY from .env.local.)\n");
console.log("Then push any change (or redeploy) so the site picks them up. Keep the password somewhere safe for Mimi.");
