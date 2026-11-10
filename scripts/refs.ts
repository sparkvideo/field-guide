// Finds verse references inside a line of guide text.
// Understands: "John 1:1", "Isa 44:6; 48:12", "Rev 1:17 / 22:13", "Heb 1:8, 10–12", "Ps 95" (whole chapter),
// "Isaiah 43–45", "Q 5:47", "Alma 11:28–29", "D&C 130:22", "JST Genesis 50:33", "Sunan Abi Dawud 4449".

import { BOOKS, SINGLE_CHAPTER_BOOKS, type Book } from "../lib/books";
import type { VerseRef } from "../lib/types";

// Spellings the guide uses (capitalised, so ordinary words like "is" or "mark" never match).
const SPELLING = new Map<string, Book>();
for (const book of BOOKS) {
  SPELLING.set(book.name, book);
  SPELLING.set(book.short, book);
}
SPELLING.set("Psalm", BOOKS.find((x) => x.slug === "psalms")!);
const NAMES = [...SPELLING.keys()].sort((a, z) => z.length - a.length).map((n) => n.replace(/ /g, "\\s"));

const NUMS = "(\\d+)(?::(\\d+)(?:[–-](\\d+))?|[–-](\\d+)(?!:\\d))?(?!\\d|:\\d)";
const BIBLE = new RegExp(`(?<![A-Za-z0-9])(${NAMES.join("|")})\\.?\\s+${NUMS}`, "g");
const QURAN = /(?<![A-Za-z])(?:Q|Surah)\s+(\d+):(\d+)(?:[–-](\d+))?/g;
const BOM = /(?<![A-Za-z0-9])(1 Nephi|2 Nephi|Alma|Moroni|Mormon)\s+(\d+):(\d+)(?:[–-](\d+))?/g;
const DC = /D&C\s+(\d+):(\d+)/g;
const JST = /JST\s+\*{0,2}(Genesis)\s+(\d+):(\d+)/g;
const HADITH = /(Sunan Abi Dawud|Sunan an-Nasa'i|Bukhari|Nasa'i)\s+(\d+)/g;

// What may follow a reference to continue it in the same book.
const NEXT_CHAPTER = /^\s*(?:;|\/|\+|,|and|→)\s*(\d+):(\d+)(?:[–-](\d+))?(?!\d|:\d)/; // "; 48:12"
const NEXT_VERSE = /^\s*,\s*(\d+)(?:[–-](\d+))?(?![\d:])(?!\s+(?:Cor|Sam|John|Pet|Tim|Kings|Thess|Chr|Nephi)\b)/; // ", 10–12"

type Found = { start: number; end: number; ref: VerseRef };

function range(a: number, z?: number) {
  return z && z !== a ? `${a}–${z}` : `${a}`;
}

function bibleRef(book: Book, chapter: number, vs?: number, ve?: number, chapterEnd?: number): VerseRef {
  // "Jude 5" means verse 5 of a one-chapter book.
  if (SINGLE_CHAPTER_BOOKS.has(book.slug) && vs === undefined && !chapterEnd) {
    return {
      label: `${book.short} ${chapter}`,
      kind: "bible",
      key: `${book.slug}.1.${chapter}`,
      book: book.slug,
      chapter: 1,
      verseStart: chapter,
      verseEnd: chapter,
    };
  }
  if (vs === undefined) {
    return {
      label: `${book.short} ${range(chapter, chapterEnd)}`,
      kind: "bible",
      key: `${book.slug}.${chapter}${chapterEnd ? `-${chapterEnd}` : ""}`,
      book: book.slug,
      chapter,
      ...(chapterEnd ? { chapterEnd } : {}),
    };
  }
  const end = ve ?? vs;
  return {
    label: `${book.short} ${chapter}:${range(vs, end)}`,
    kind: "bible",
    key: `${book.slug}.${chapter}.${vs}${end !== vs ? `-${end}` : ""}`,
    book: book.slug,
    chapter,
    verseStart: vs,
    verseEnd: end,
  };
}

function quranRef(sura: number, vs: number, ve?: number): VerseRef {
  const end = ve ?? vs;
  return {
    label: `Q ${sura}:${range(vs, end)}`,
    kind: "quran",
    key: `q.${sura}.${vs}${end !== vs ? `-${end}` : ""}`,
    chapter: sura,
    verseStart: vs,
    verseEnd: end,
  };
}

const num = (s?: string) => (s === undefined ? undefined : Number(s));

export function extractRefs(text: string): VerseRef[] {
  const found: Found[] = [];
  const free = (start: number, end: number) => !found.some((f) => start < f.end && end > f.start);
  const add = (start: number, end: number, ref: VerseRef) => {
    if (free(start, end)) found.push({ start, end, ref });
  };

  for (const m of text.matchAll(JST)) {
    add(m.index!, m.index! + m[0].length, {
      label: `JST Genesis ${m[2]}:${m[3]}`,
      kind: "jst",
      key: `jst.genesis.${m[2]}.${m[3]}`,
    });
  }
  for (const m of text.matchAll(HADITH)) {
    add(m.index!, m.index! + m[0].length, {
      label: `${m[1]} ${m[2]}`,
      kind: "hadith",
      key: `hadith.${m[1].toLowerCase().replace(/[^a-z]+/g, "-")}.${m[2]}`,
    });
  }
  for (const m of text.matchAll(BOM)) {
    const end = m[4] ?? m[3];
    add(m.index!, m.index! + m[0].length, {
      label: `${m[1]} ${m[2]}:${range(Number(m[3]), Number(end))}`,
      kind: "bom",
      key: `bom.${m[1].toLowerCase().replace(/ /g, "-")}.${m[2]}.${m[3]}${end !== m[3] ? `-${end}` : ""}`,
    });
  }
  for (const m of text.matchAll(DC)) {
    add(m.index!, m.index! + m[0].length, { label: `D&C ${m[1]}:${m[2]}`, kind: "dc", key: `dc.${m[1]}.${m[2]}` });
  }

  // Bible and Quran references can continue: "Isa 44:6; 48:12" or "Heb 1:8, 10–12".
  const withContinuations = (start: number, end: number, first: VerseRef, make: (c: number, vs: number, ve?: number) => VerseRef) => {
    if (!free(start, end)) return;
    found.push({ start, end, ref: first });
    let chapter = first.chapter!;
    let hasVerse = first.verseStart !== undefined;
    let pos = end;
    for (;;) {
      const rest = text.slice(pos).replace(/^\*+/, (s) => " ".repeat(s.length));
      let m = rest.match(NEXT_CHAPTER);
      if (m) {
        chapter = Number(m[1]);
        hasVerse = true;
        found.push({ start: pos, end: pos + m[0].length, ref: make(chapter, Number(m[2]), num(m[3])) });
        pos += m[0].length;
        continue;
      }
      m = hasVerse ? rest.match(NEXT_VERSE) : null;
      if (m) {
        found.push({ start: pos, end: pos + m[0].length, ref: make(chapter, Number(m[1]), num(m[2])) });
        pos += m[0].length;
        continue;
      }
      break;
    }
  };

  for (const m of text.matchAll(QURAN)) {
    withContinuations(m.index!, m.index! + m[0].length, quranRef(Number(m[1]), Number(m[2]), num(m[3])), quranRef);
  }
  for (const m of text.matchAll(BIBLE)) {
    const book = SPELLING.get(m[1].replace(/\s/g, " "))!;
    const first = bibleRef(book, Number(m[2]), num(m[3]), num(m[4]), num(m[5]));
    withContinuations(m.index!, m.index! + m[0].length, first, (c, vs, ve) => bibleRef(book, c, vs, ve));
  }

  found.sort((a, z) => a.start - z.start);
  const seen = new Set<string>();
  return found.map((f) => f.ref).filter((r) => (seen.has(r.key) ? false : (seen.add(r.key), true)));
}

/** Chapter:verse numbers in the text that no reference above claimed (e.g. a bare "(8:6)"). */
export function bareRefs(text: string): string[] {
  let masked = text;
  for (const re of [JST, HADITH, BOM, DC]) masked = masked.replace(re, (s) => "#".repeat(s.length));
  const mask = (re: RegExp) => {
    let out = "";
    let last = 0;
    for (const m of masked.matchAll(re)) {
      let end = m.index! + m[0].length;
      for (;;) {
        const rest = masked.slice(end).replace(/^\*+/, (s) => " ".repeat(s.length));
        const c = rest.match(NEXT_CHAPTER) || rest.match(NEXT_VERSE);
        if (!c) break;
        end += c[0].length;
      }
      if (m.index! < last) continue;
      out += masked.slice(last, m.index!) + "#".repeat(end - m.index!);
      last = end;
    }
    masked = out + masked.slice(last);
  };
  mask(QURAN);
  mask(BIBLE);
  return [...masked.matchAll(/(?<![\d.])\d+:\d+(?:[–-]\d+)?(?:, \d+)?/g)].map((m) => m[0]);
}
