// Loads Bible text in the browser. Everything comes from static files under /bible/,
// which the offline worker keeps on the phone.

import { BOOKS } from "./books";

export type BookFile = { name: string; chapters: string[][] };
export type BibleIndex = { slug: string; name: string; short: string; chapters: number[] }[];

const bookCache = new Map<string, Promise<BookFile>>();
let indexCache: Promise<BibleIndex> | undefined;

export function loadBook(slug: string): Promise<BookFile> {
  if (!bookCache.has(slug)) {
    const p = fetch(`/bible/${slug}.json`).then((r) => {
      if (!r.ok) throw new Error("Book not found");
      return r.json() as Promise<BookFile>;
    });
    p.catch(() => bookCache.delete(slug));
    bookCache.set(slug, p);
  }
  return bookCache.get(slug)!;
}

export function loadIndex(): Promise<BibleIndex> {
  if (!indexCache) {
    indexCache = fetch("/bible/index.json").then((r) => r.json() as Promise<BibleIndex>);
    indexCache.catch(() => (indexCache = undefined));
  }
  return indexCache;
}

// ───────── word and phrase search ─────────
// Four files hold every verse as "bookNumber|chapter|verse|text". Searching is a straight scan,
// which takes a few milliseconds and finds exact phrases.

export type Hit = { book: number; slug: string; ref: string; chapter: number; verse: number; text: string; exact: boolean };

const CHUNKS = 4;
type Chunk = { lines: string[]; norm: string[] };
const chunkCache: (Promise<Chunk> | undefined)[] = [];

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function loadChunk(n: number): Promise<Chunk> {
  if (!chunkCache[n]) {
    const p = fetch(`/bible/search-${n + 1}.json`)
      .then((r) => r.json() as Promise<string[]>)
      .then((lines) => ({
        lines,
        norm: lines.map((l) => {
          const i = l.indexOf("|", l.indexOf("|", l.indexOf("|") + 1) + 1);
          return " " + normalize(l.slice(i + 1)) + " ";
        }),
      }));
    p.catch(() => (chunkCache[n] = undefined));
    chunkCache[n] = p;
  }
  return chunkCache[n]!;
}

/** Start downloading the search files (called when the search bar is focused). */
export function warmSearch() {
  for (let n = 0; n < CHUNKS; n++) loadChunk(n).catch(() => {});
}

function toHit(line: string, exact: boolean): Hit {
  const [b, c, v] = line.split("|", 3);
  const text = line.slice(b.length + c.length + v.length + 3);
  const book = BOOKS[Number(b)];
  return { book: Number(b), slug: book.slug, ref: `${book.name} ${c}:${v}`, chapter: Number(c), verse: Number(v), text, exact };
}

/**
 * Finds verses containing the phrase (first), then verses containing all the words.
 * Calls `onProgress` as each part of the Bible finishes, so results appear quickly.
 */
export async function searchBible(query: string, onProgress?: (hits: Hit[]) => void): Promise<Hit[]> {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const phrase = " " + q + " ";
  const exact: Hit[] = [];
  const loose: Hit[] = [];
  for (let n = 0; n < CHUNKS; n++) {
    const chunk = await loadChunk(n);
    for (let i = 0; i < chunk.norm.length; i++) {
      const t = chunk.norm[i];
      if (t.includes(phrase)) exact.push(toHit(chunk.lines[i], true));
      else if (words.length > 1 && loose.length < 500 && words.every((w) => t.includes(" " + w + " "))) loose.push(toHit(chunk.lines[i], false));
    }
    onProgress?.([...exact, ...loose]);
  }
  return [...exact, ...loose];
}
