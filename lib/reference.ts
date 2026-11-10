// Understands what people type for a Bible reference:
// "john 1:1", "jn 1 1", "Jn1:1-3", "1 cor 8:6", "first corinthians 8", "ps 23", "isa 44:6-8", "Song of Songs 2"

import { findBook, SINGLE_CHAPTER_BOOKS, type Book } from "./books";

export type TypedRef = { book: Book; chapter: number; verseStart?: number; verseEnd?: number };

const PATTERN =
  /^((?:[123]|i{1,3}|first|second|third|1st|2nd|3rd)?\s*[a-z][a-z ]*?)\.?\s*(\d{1,3})(?:\s*[:.,\s]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?$/;

export function parseReference(typed: string): TypedRef | undefined {
  const text = typed.toLowerCase().replace(/\s+/g, " ").trim();
  const m = text.match(PATTERN);
  if (!m) return undefined;
  const book = findBook(m[1]);
  if (!book) return undefined;
  let chapter = Number(m[2]);
  let verseStart = m[3] ? Number(m[3]) : undefined;
  let verseEnd = m[4] ? Number(m[4]) : verseStart;
  // "jude 5" means verse 5 of a one-chapter book
  if (SINGLE_CHAPTER_BOOKS.has(book.slug) && verseStart === undefined && chapter > 1) {
    verseStart = chapter;
    verseEnd = chapter;
    chapter = 1;
  }
  if (chapter < 1 || (verseStart !== undefined && (verseStart < 1 || verseEnd! < verseStart))) return undefined;
  return { book, chapter, verseStart, verseEnd };
}

/** "John 1:1–3" (for display) */
export function formatRef(r: { book: { name: string }; chapter: number; verseStart?: number; verseEnd?: number }, dash = "–"): string {
  if (r.verseStart === undefined) return `${r.book.name} ${r.chapter}`;
  const end = r.verseEnd && r.verseEnd !== r.verseStart ? `${dash}${r.verseEnd}` : "";
  return `${r.book.name} ${r.chapter}:${r.verseStart}${end}`;
}

/** Link to the in-app reader. */
export function readerHref(slug: string, chapter: number, verseStart?: number, verseEnd?: number): string {
  const v = verseStart ? `&v=${verseStart}${verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ""}` : "";
  return `/read?b=${slug}&c=${chapter}${v}`;
}
