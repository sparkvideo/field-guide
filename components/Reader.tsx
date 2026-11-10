"use client";
// The Bible reader: one chapter, with the chosen verse highlighted.
// Address looks like /read?b=john&c=1&v=1-3

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadBook, loadIndex, type BibleIndex, type BookFile } from "@/lib/bible";
import { lsbLink } from "@/lib/config";
import { readerHref } from "@/lib/reference";
import { TopBar } from "./TopBar";

type Use = { href: string; title: string; label: string };
type VerseIndex = Record<string, { label: string; uses: Use[] }>;

export function Reader() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("b") || "john";
  const chapter = Math.max(1, Number(params.get("c")) || 1);
  const [vs, ve] = (params.get("v") || "").split("-").map((n) => Number(n) || 0);
  const from = vs || 0;
  const to = ve || from;

  const [book, setBook] = useState<BookFile | null>(null);
  const [index, setIndex] = useState<BibleIndex | null>(null);
  const [uses, setUses] = useState<VerseIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setBook(null);
    setFailed(false);
    loadBook(slug).then(setBook).catch(() => setFailed(true));
  }, [slug]);
  useEffect(() => {
    loadIndex().then(setIndex).catch(() => {});
    import("@/content/verse-index.json").then((m) => setUses(m.default as unknown as VerseIndex)).catch(() => {});
  }, []);
  useEffect(() => {
    if (!book) return;
    const el = from ? document.getElementById(`v${from}`) : null;
    if (el) el.scrollIntoView({ block: "center" });
    else window.scrollTo(0, 0);
  }, [book, chapter, from]);

  const verses = book?.chapters[chapter - 1];
  const bookNumber = index?.findIndex((b) => b.slug === slug) ?? -1;

  // previous / next chapter (crossing into the neighbouring book at the ends)
  const neighbours = useMemo(() => {
    if (!index || bookNumber < 0) return {};
    const here = index[bookNumber];
    const prev = chapter > 1 ? readerHref(slug, chapter - 1) : bookNumber > 0 ? readerHref(index[bookNumber - 1].slug, index[bookNumber - 1].chapters.length) : undefined;
    const next = chapter < here.chapters.length ? readerHref(slug, chapter + 1) : bookNumber < index.length - 1 ? readerHref(index[bookNumber + 1].slug, 1) : undefined;
    return { prev, next };
  }, [index, bookNumber, chapter, slug]);

  // "Used in the guide": guide lines that cite the highlighted verses (or anything in this chapter)
  const usedIn = useMemo(() => {
    if (!uses) return [];
    const out: Use[] = [];
    for (const [key, entry] of Object.entries(uses)) {
      const [b, c, v] = key.split(".");
      if (b !== slug) continue;
      const [c1, c2] = c.split("-").map(Number);
      if (chapter < c1 || chapter > (c2 || c1)) continue;
      if (from && v) {
        const [a, z] = v.split("-").map(Number);
        if (to < a || from > (z || a)) continue;
      }
      for (const u of entry.uses) if (!out.some((o) => o.href === u.href)) out.push(u);
    }
    return out;
  }, [uses, slug, chapter, from, to]);

  const title = `${book?.name ?? ""} ${chapter}`;
  const lsbRef = `${book?.name ?? ""} ${chapter}${from ? `:${from}${to !== from ? `-${to}` : ""}` : ""}`;

  return (
    <>
      <TopBar back="history" share={book ? { title: lsbRef } : undefined} />
      <main
        className="page"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          touch.current = null;
          if (Math.abs(dx) < 90 || Math.abs(dy) > 60) return;
          const target = dx < 0 ? neighbours.next : neighbours.prev;
          if (target) router.replace(target);
        }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-[28px] font-bold leading-tight">{book ? title : " "}</h1>
          <span className="tag">BSB</span>
        </div>

        {failed && <p className="muted mt-6">This chapter isn&rsquo;t available offline yet. Connect once and it will download.</p>}
        {book && !verses && <p className="muted mt-6">There is no chapter {chapter} in {book.name}.</p>}

        {verses && (
          <>
            <p className="mt-4">
              <a className="btn primary" href={lsbLink(lsbRef)} target="_blank" rel="noopener noreferrer">
                Open in LSB
              </a>
            </p>

            {usedIn.length > 0 && (
              <p className="small mt-4">
                <span className="muted">Used in the guide: </span>
                {usedIn.slice(0, 6).map((u, i) => (
                  <span key={u.href}>
                    {i > 0 && " · "}
                    <Link className="link" href={u.href}>
                      {u.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            <div className="mt-6 text-[20px] leading-[1.7]">
              {verses.map((text, i) => {
                const n = i + 1;
                if (!text) return null;
                const on = from && n >= from && n <= to;
                return (
                  <span key={n} id={`v${n}`} className={on ? "verse-on" : undefined}>
                    <sup className="vn">{n}</sup>
                    {text}{" "}
                  </span>
                );
              })}
            </div>

            <nav className="mt-10 grid grid-cols-2 gap-3" aria-label="Chapters">
              {neighbours.prev ? (
                <Link className="btn" href={neighbours.prev} replace>
                  ‹ Previous
                </Link>
              ) : (
                <span />
              )}
              {neighbours.next ? (
                <Link className="btn" href={neighbours.next} replace>
                  Next ›
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </main>
    </>
  );
}
