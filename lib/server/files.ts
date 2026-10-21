import "server-only";
import { getStore, type Store } from "@netlify/blobs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Where order files live: Netlify Blobs on Netlify (private, only reachable through this site's own
// server code), a folder on disk in local development. Test builds and the live site use different
// stores, so the files made while testing never mix with real customers' files.

const live = process.env.MIMI_LIVE === "true";
const storeName = live ? "order-files" : "order-files-test";
/** The real shop's first files (before MIMI_LIVE was switched on, 20-21 Oct) went to the test store: still read from there. */
const earlierStoreName = live ? "order-files-test" : null;
let store: Store | null | undefined;
let earlier: Store | null | undefined;

function openStore(name: string) {
  try {
    // Strong consistency: a photo just uploaded can be opened straight away.
    return getStore({ name, consistency: "strong", region: "us-east-2" });
  } catch (e) {
    // Outside Netlify there's no Blobs environment. That's only acceptable in local development.
    if (process.env.NODE_ENV === "production") throw e;
    return null;
  }
}

function netlifyStore() {
  if (store === undefined) store = openStore(storeName);
  return store;
}

function earlierStore() {
  if (earlier === undefined) earlier = earlierStoreName ? openStore(earlierStoreName) : null;
  return earlier;
}

const localDir = join(process.cwd(), ".data", storeName);
const localPath = (key: string) => join(localDir, key.replace(/[^a-z0-9._-]/gi, "_"));

export async function putFile(key: string, data: Buffer, contentType: string) {
  const s = netlifyStore();
  if (s) {
    await s.set(key, new Blob([new Uint8Array(data)], { type: contentType }), { metadata: { contentType } });
    return;
  }
  await mkdir(localDir, { recursive: true });
  await writeFile(localPath(key), data);
}

export async function getFile(key: string): Promise<ArrayBuffer | null> {
  const s = netlifyStore();
  if (s) return (await s.get(key, { type: "arrayBuffer" })) ?? (await earlierStore()?.get(key, { type: "arrayBuffer" })) ?? null;
  try {
    const b = await readFile(localPath(key));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function deleteFile(key: string) {
  const s = netlifyStore();
  if (s) {
    await s.delete(key);
    await earlierStore()?.delete(key);
    return;
  }
  await rm(localPath(key), { force: true });
}
