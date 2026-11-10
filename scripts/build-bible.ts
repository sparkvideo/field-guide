// Splits the Berean Standard Bible (public domain) into one small JSON file per book,
// plus compact search files, all under /public/bible/.
//
// Run with: npm run parse
//
// Source file: data/bsb-source.json  ({ books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] })

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { BOOKS } from "../lib/books";

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "data", "bsb-source.json");
const OUT = path.join(ROOT, "public", "bible");

type SourceBook = { name: string; chapters: { chapter: number; verses: { verse: number; text: string }[] }[] };

const source: { books: SourceBook[] } = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
if (source.books.length !== 66) throw new Error(`Expected 66 books, found ${source.books.length}`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sizes: { file: string; raw: number; gz: number }[] = [];
function write(file: string, data: unknown) {
  const json = JSON.stringify(data);
  fs.writeFileSync(path.join(OUT, file), json);
  sizes.push({ file, raw: Buffer.byteLength(json), gz: zlib.gzipSync(json).length });
}

// 1) One file per book:  { name, chapters: [ [verse1, verse2, ...], ... ] }
//    chapters[0][0] is chapter 1 verse 1. An empty string means the BSB omits that verse.
const index: { slug: string; name: string; short: string; chapters: number[] }[] = [];
let verseCount = 0;
let omitted = 0;

// 2) Search files: every verse as one line "bookIndex|chapter|verse|text", grouped in 4 chunks
//    so the phone can start searching the first chunk right away.
const CHUNKS: [string, number, number][] = [
  ["search-1.json", 0, 16], // Genesis – Esther
  ["search-2.json", 17, 21], // Job – Song of Solomon
  ["search-3.json", 22, 38], // Isaiah – Malachi
  ["search-4.json", 39, 65], // Matthew – Revelation
];
const chunkLines: string[][] = CHUNKS.map(() => []);

source.books.forEach((src, i) => {
  const book = BOOKS[i];
  const chapters = src.chapters.map((c, ci) => {
    if (c.chapter !== ci + 1) throw new Error(`${book.name}: chapter out of order`);
    return c.verses.map((v, vi) => {
      if (v.verse !== vi + 1) throw new Error(`${book.name} ${c.chapter}: verse out of order`);
      const text = (v.text || "").trim();
      verseCount++;
      if (!text) omitted++;
      return text;
    });
  });
  write(`${book.slug}.json`, { name: book.name, chapters });
  index.push({ slug: book.slug, name: book.name, short: book.short, chapters: chapters.map((c) => c.length) });

  const chunk = CHUNKS.findIndex(([, from, to]) => i >= from && i <= to);
  chapters.forEach((verses, ci) =>
    verses.forEach((text, vi) => {
      if (text) chunkLines[chunk].push(`${i}|${ci + 1}|${vi + 1}|${text}`);
    })
  );
});

const bookSizes = [...sizes];
sizes.length = 0;
CHUNKS.forEach(([file], n) => write(file, chunkLines[n]));
const searchSizes = [...sizes];
sizes.length = 0;
write("index.json", index); // book list + how many verses each chapter has

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
const sum = (list: { raw: number; gz: number }[], k: "raw" | "gz") => list.reduce((a, x) => a + x[k], 0);
const biggest = [...bookSizes].sort((a, z) => z.raw - a.raw)[0];

const report = {
  verses: verseCount,
  omittedVerses: omitted,
  bookFiles: { count: bookSizes.length, raw: sum(bookSizes, "raw"), gz: sum(bookSizes, "gz"), biggest },
  searchFiles: searchSizes,
  searchTotal: { raw: sum(searchSizes, "raw"), gz: sum(searchSizes, "gz") },
};
fs.writeFileSync(path.join(ROOT, "content", "bible-report.json"), JSON.stringify(report, null, 2));

console.log("BIBLE (Berean Standard Bible)");
console.log(`  ${verseCount} verses in 66 books (${omitted} verse numbers the BSB leaves empty)`);
console.log(`  66 book files: ${kb(report.bookFiles.raw)} total, ${kb(report.bookFiles.gz)} compressed`);
console.log(`  biggest book file: ${biggest.file} ${kb(biggest.raw)} (${kb(biggest.gz)} compressed)`);
for (const s of searchSizes) console.log(`  ${s.file}: ${kb(s.raw)} (${kb(s.gz)} compressed)`);
console.log(`  search files total: ${kb(report.searchTotal.raw)} (${kb(report.searchTotal.gz)} compressed)`);
