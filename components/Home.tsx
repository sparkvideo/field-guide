"use client";
// Home: one search bar, then the list of who you're talking to.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadBook, searchBible, warmSearch, normalize, type Hit } from "@/lib/bible";
import { lsbLink } from "@/lib/config";
import { getPins, getRecent, markSeen, seen, type Pin } from "@/lib/pins";
import { formatRef, parseReference, readerHref, type TypedRef } from "@/lib/reference";
import { searchGuide } from "@/lib/search";
import { Chevron } from "./Bits";
import { NotificationsRow } from "./Notifications";
import { readStreak } from "./Train";

type GroupRow = { slug: string; name: string; color: string };

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SMALL_WORDS = new Set(["the", "and", "of", "a", "an", "to", "in", "is", "for", "on"]);

/** Highlights the phrase if the verse has it; otherwise the individual (meaningful) words. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return <>{text}</>;
  let re = new RegExp(`(\\b${words.map(esc).join("[^A-Za-z0-9]+")}\\b)`, "gi");
  if (!re.test(text)) {
    const keep = words.filter((w) => !SMALL_WORDS.has(w));
    re = new RegExp(`\\b(${(keep.length ? keep : words).map(esc).join("|")})\\b`, "gi");
  }
  const parts = text.split(re);
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}</>;
}

export function Home({ groups }: { groups: GroupRow[] }) {
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<Pin[]>([]);
  const [recent, setRecent] = useState<Pin[]>([]);
  const [streak, setStreak] = useState(0);
  const [verse, setVerse] = useState<{ ref: TypedRef; lines: [number, string][] } | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [limit, setLimit] = useState(50);
  const [tip, setTip] = useState(false);
  const run = useRef(0);

  // Restore the last search when coming back from a result.
  useEffect(() => {
    try {
      setQuery(sessionStorage.getItem("fg-q") || "");
    } catch {}
    setStreak(readStreak().count);
    const pinned = getPins();
    setPins(pinned);
    setRecent(getRecent().slice(0, 1).filter((r) => !pinned.some((p) => p.href === r.href)));
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const safari = /safari/i.test(ua) && !/crios|fxios|edgios|gsa\//i.test(ua);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (ios && safari && !standalone && !seen("fg-install-tip")) setTip(true);
  }, []);

  const q = query.trim();
  const typedRef = useMemo(() => parseReference(q), [q]);
  const guideResults = useMemo(() => (q.length >= 2 ? searchGuide(q) : []), [q]);

  useEffect(() => {
    try {
      sessionStorage.setItem("fg-q", query);
    } catch {}
    const id = ++run.current;
    setLimit(50);
    setVerse(null);
    if (typedRef) {
      setHits([]);
      loadBook(typedRef.book.slug)
        .then((book) => {
          if (id !== run.current) return;
          const chapter = book.chapters[typedRef.chapter - 1];
          if (!chapter) return;
          const from = typedRef.verseStart ?? 1;
          const to = Math.min(typedRef.verseEnd ?? chapter.length, chapter.length);
          if (from > chapter.length) return;
          const lines: [number, string][] = [];
          for (let v = from; v <= to; v++) lines.push([v, chapter[v - 1]]);
          setVerse({ ref: typedRef, lines });
        })
        .catch(() => {});
      return;
    }
    if (normalize(q).length < 3) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchBible(q, (partial) => id === run.current && setHits(partial))
        .then((all) => {
          if (id !== run.current) return;
          setHits(all);
          setSearching(false);
        })
        .catch(() => id === run.current && setSearching(false));
    }, 120);
    return () => clearTimeout(timer);
  }, [q, typedRef, query]);

  const dismissTip = () => {
    markSeen("fg-install-tip");
    setTip(false);
  };

  return (
    <main className="page" style={{ paddingTop: "calc(env(safe-area-inset-top) + 20px)" }}>
      <h1 className="mb-4 text-[15px] font-semibold tracking-wide text-muted">Field Guide: Apologetics</h1>

      <div className="search" role="search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="Search a verse or what they said"
          placeholder="Search a verse or what they said…"
          value={query}
          onFocus={warmSearch}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="icon-btn -mr-3" aria-label="Clear search" onClick={() => setQuery("")}>
            ✕
          </button>
        )}
      </div>

      {q.length >= 2 ? (
        <div aria-live="polite">
          {verse && (
            <section className="section">
              <h2 className="label">Verse</h2>
              <Link href={readerHref(verse.ref.book.slug, verse.ref.chapter, verse.ref.verseStart, verse.ref.verseEnd)} className="rows block p-4">
                <span className="font-bold">{formatRef(verse.ref)}</span> <span className="tag ml-1">BSB</span>
                <span className="mt-2 block text-[19px] leading-[1.55]">
                  {verse.lines.slice(0, 12).map(([n, t]) => (
                    <span key={n}>
                      {verse.lines.length > 1 && <sup className="vn">{n}</sup>}
                      {t}{" "}
                    </span>
                  ))}
                  {verse.lines.length > 12 && <span className="muted">… tap to read the chapter</span>}
                </span>
              </Link>
              <p className="mt-3">
                <a className="btn primary" href={lsbLink(formatRef(verse.ref, "-"))} target="_blank" rel="noopener noreferrer">
                  Open in LSB
                </a>
              </p>
            </section>
          )}

          {guideResults.length > 0 && (
            <section className="section">
              <h2 className="label">In the guide</h2>
              <div className="rows">
                {guideResults.map((r, i) => (
                  <Link key={i} href={r.href} className="row">
                    <span>
                      <span className="block text-[13px] font-semibold uppercase tracking-wide text-muted">{r.label}</span>
                      <span className="block">{r.title}</span>
                    </span>
                    <Chevron />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!typedRef && hits.length > 0 && (
            <section className="section">
              <h2 className="label">In the Bible</h2>
              <div className="rows">
                {hits.slice(0, limit).map((h) => (
                  <Link key={h.ref} href={readerHref(h.slug, h.chapter, h.verse)} className="row">
                    <span>
                      <span className="block font-bold">{h.ref}</span>
                      <span className="block">
                        <Highlight text={h.text} query={q} />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              {hits.length > limit && (
                <button className="btn mt-4 w-full" onClick={() => setLimit(limit + 50)}>
                  Show more ({hits.length - limit} more)
                </button>
              )}
            </section>
          )}

          {!verse && !guideResults.length && !hits.length && !searching && <p className="muted mt-8">Nothing found.</p>}

        </div>
      ) : (
        <>
          {[
            { title: "Pinned", list: pins },
            { title: "Recent", list: recent },
          ].map(
            (group) =>
              group.list.length > 0 && (
                <section key={group.title} className="section" style={{ marginTop: 24 }}>
                  <h2 className="label">{group.title}</h2>
                  <div className="rows">
                    {group.list.map((p) => (
                      <Link key={p.href} href={p.href} className="row">
                        <span>
                          <span className="block text-[13px] font-semibold uppercase tracking-wide text-muted">{p.label}</span>
                          <span className="block">{p.title}</span>
                        </span>
                        <Chevron />
                      </Link>
                    ))}
                  </div>
                </section>
              )
          )}

          <nav className="rows mt-6" aria-label="Who are you talking to?">
            {groups.map((g) => (
              <Link key={g.slug} href={`/${g.slug}`} className="row text-[20px] font-semibold">
                <span className="dot" style={{ background: g.color }} aria-hidden="true" />
                {g.name}
                <Chevron />
              </Link>
            ))}
            <Link href="/holy-spirit" className="row">
              <span aria-hidden="true">🔥</span>
              <span>
                <span className="block text-[20px] font-semibold">The Holy Spirit</span>
                <span className="sub">Anyone denying the Trinity</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/method" className="row text-[20px] font-semibold">
              <span aria-hidden="true">🎯</span>
              The Method
              <Chevron />
            </Link>
            <Link href="/train" className="row">
              <span aria-hidden="true">💪</span>
              <span>
                <span className="block text-[20px] font-semibold">Train</span>
                <span className="sub">Daily question and drills{streak > 0 ? ` · 🔥 ${streak}` : ""}</span>
              </span>
              <Chevron />
            </Link>
          </nav>

          <NotificationsRow />

          <p className="mt-8 text-center">
            <Link href="/about" className="muted small inline-flex min-h-[48px] items-center px-4">
              About
            </Link>
          </p>
        </>
      )}

      {tip && (
        <div className="toast" role="status">
          <span>Tap Share ⬆️ then &lsquo;Add to Home Screen&rsquo; to install.</span>
          <button aria-label="Dismiss" onClick={dismissTip}>
            ✕
          </button>
        </div>
      )}
    </main>
  );
}
