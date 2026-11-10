"use client";
// Tappable verse chips, and the sheet that slides up with the verse text.
// Guide verses show the LSB text if it has been filled in; otherwise the BSB text with a "BSB" label.

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BOOKS } from "@/lib/books";
import { LSB_URL, lsbLink, quranLink } from "@/lib/config";
import { getPins, togglePin } from "@/lib/pins";
import { readerHref } from "@/lib/reference";
import type { VerseRef } from "@/lib/types";
import { Md } from "./Md";

type Open = { ref: VerseRef; context?: string };
const Ctx = createContext<(o: Open) => void>(() => {});

type VerseData = {
  lsb: Record<string, string>;
  bsb: Record<string, { ref: string; bsb: [number, string][] }>;
};
let dataPromise: Promise<VerseData> | undefined;
function loadData(): Promise<VerseData> {
  dataPromise ||= Promise.all([import("@/content/lsb-verses.json"), import("@/content/guide-verses.json")]).then(([l, b]) => ({
    lsb: Object.fromEntries((l.default as { key: string; text: string }[]).map((x) => [x.key, x.text])),
    bsb: b.default as unknown as VerseData["bsb"],
  }));
  return dataPromise;
}

const OTHER_SOURCE: Record<string, string> = {
  bom: "Book of Mormon",
  dc: "Doctrine and Covenants",
  jst: "Joseph Smith Translation",
  hadith: "Hadith",
};

export function VerseSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const [shown, setShown] = useState(false);
  const [data, setData] = useState<VerseData | null>(null);
  const [saved, setSaved] = useState(false);
  const [big, setBig] = useState(false); // "Show them": the verse alone, in large type
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback((o: Open) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setOpen(o);
    setSaved(o.ref.kind === "bible" && getPins().some((p) => p.href === readerHref(o.ref.book!, o.ref.chapter!, o.ref.verseStart, o.ref.verseEnd)));
    loadData().then(setData).catch(() => {});
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);
  const close = useCallback(() => {
    setShown(false);
    setBig(false);
    setTimeout(() => {
      setOpen(null);
      lastFocus.current?.focus?.();
    }, 240);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const r = open?.ref;
  const book = r?.book ? BOOKS.find((b) => b.slug === r.book) : undefined;
  const fullRef = r && book ? r.label.replace(/^\S+(?: \S+)?(?= \d)/, book.name) : r?.label;
  const lsb = r && data ? (data.lsb[r.key] || "").trim() : "";
  const bsb = r && data ? data.bsb[r.key] : undefined;

  return (
    <Ctx.Provider value={show}>
      {children}
      {open && r && (
        <>
          <div className={`sheet-backdrop ${shown ? "open" : ""}`} onClick={close} aria-hidden="true" />
          <div className={`sheet ${shown ? "open" : ""}`} role="dialog" aria-modal="true" aria-label={fullRef}>
            <div className="sheet-inner">
              <div className="grabber" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3">
                <h2 className="serif text-[22px] font-bold">{fullRef}</h2>
                <span className="flex items-center">
                  {r.kind === "bible" && (
                    <button
                      className="icon-btn"
                      aria-pressed={saved}
                      aria-label={saved ? "Remove from pinned" : "Pin this verse"}
                      onClick={() => setSaved(togglePin({ href: readerHref(r.book!, r.chapter!, r.verseStart, r.verseEnd), title: fullRef!, label: "Verse" }))}
                    >
                      {saved ? "★" : "☆"}
                    </button>
                  )}
                  <button ref={closeRef} className="icon-btn" onClick={close} aria-label="Close">
                    ✕
                  </button>
                </span>
              </div>

              {r.kind === "bible" && (
                <>
                  {r.verseStart !== undefined && (
                    <div className="serif mt-2 text-[21px] leading-[1.55]">
                      {!data ? (
                        <p className="muted">…</p>
                      ) : lsb ? (
                        <>
                          <p>{lsb}</p>
                          <p className="mt-3">
                            <a className="tag" href={LSB_URL} target="_blank" rel="noopener noreferrer">
                              LSB
                            </a>
                          </p>
                        </>
                      ) : bsb ? (
                        <>
                          <p>
                            {bsb.bsb.map(([n, t]) => (
                              <span key={n}>
                                {bsb.bsb.length > 1 && <sup className="vn">{n}</sup>}
                                {t}{" "}
                              </span>
                            ))}
                          </p>
                          <p className="mt-3">
                            <span className="tag">BSB</span>
                          </p>
                        </>
                      ) : null}
                    </div>
                  )}
                  {(lsb || bsb) && (
                    <button className="btn primary mt-5 w-full" onClick={() => setBig(true)}>
                      Show them
                    </button>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Link className="btn" href={readerHref(r.book!, r.chapter!, r.verseStart, r.verseEnd)} onClick={close}>
                      Read chapter
                    </Link>
                    <a className="btn" href={lsbLink(fullRef!.replace("–", "-"))} target="_blank" rel="noopener noreferrer">
                      Open in LSB
                    </a>
                  </div>
                </>
              )}

              {r.kind === "quran" && (
                <>
                  {open.context && (
                    <p className="mt-2 text-[19px]">
                      <Md text={open.context} />
                    </p>
                  )}
                  <div className="mt-5">
                    <a className="btn primary" href={quranLink(r.chapter!, r.verseStart!, r.verseEnd)} target="_blank" rel="noopener noreferrer">
                      Open on quran.com
                    </a>
                  </div>
                </>
              )}

              {r.kind !== "bible" && r.kind !== "quran" && (
                <>
                  <p className="muted small mt-1">{OTHER_SOURCE[r.kind]}</p>
                  {open.context && (
                    <p className="mt-3 text-[19px]">
                      <Md text={open.context} />
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {big && (lsb || bsb) && (
            <div className="showthem" role="dialog" aria-modal="true" aria-label={`${fullRef}, large type`} onClick={() => setBig(false)}>
              <div>
                <p className="showthem-ref">
                  {fullRef} <span className="tag ml-2">{lsb ? "LSB" : "BSB"}</span>
                </p>
                <p className="showthem-text">
                  {lsb ||
                    bsb!.bsb.map(([n, t]) => (
                      <span key={n}>
                        {bsb!.bsb.length > 1 && <sup className="vn">{n}</sup>}
                        {t}{" "}
                      </span>
                    ))}
                </p>
                <p className="muted small mt-8">Tap anywhere to close</p>
              </div>
            </div>
          )}
        </>
      )}
    </Ctx.Provider>
  );
}

/** A row of tappable verse chips. `context` is the guide line the verses came from. */
export function VerseChips({ verses, context }: { verses: VerseRef[]; context?: string }) {
  const show = useContext(Ctx);
  if (!verses.length) return null;
  return (
    <div className="chips">
      {verses.map((v) => (
        <button key={v.key} type="button" className="chip" onClick={() => show({ ref: v, context })}>
          {v.label}
        </button>
      ))}
    </div>
  );
}
