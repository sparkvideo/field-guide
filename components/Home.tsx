"use client";
// Home: one search bar, then the list of who you're talking to.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadBook, searchBible, warmSearch, normalize, type Hit } from "@/lib/bible";
import { lsbLink } from "@/lib/config";
import { getPins, getRecent, type Pin } from "@/lib/pins";
import { formatRef, parseReference, readerHref, type TypedRef } from "@/lib/reference";
import { searchGuide } from "@/lib/search";
import { Chevron } from "./Bits";
import { BannerIcon, BookIcon, CreationIcon, CrossIcon, LifeIcon, PyramidIcon, ScalesIcon, StormIcon, GateIcon, TombIcon, FireIcon, MindIcon, PrayIcon, HourglassIcon, DoorIcon, DrillIcon, FlameIcon, GameIcon, Mark, NoteIcon, PenIcon, TabletsIcon, TargetIcon, TriangleIcon, TrinityIcon, WordsIcon } from "./Icons";
import { readStreak } from "./Train";
import { Welcome } from "./Welcome";

type GroupRow = { slug: string; name: string; color: string; plays: number; objections: number };

// The home screen is one scrolling page. Groups sit under three headings as small tiles.
const FAMILIES: { id: string; title: string; slugs: string[]; featured?: string }[] = [
  { id: "sec-religions", title: "Religious worldviews", slugs: ["muslim", "jewish", "hindu", "buddhist", "new-age", "satanist"] },
  // Mormon leads this section on a full-width tile: it's the group our men are most likely
  // to meet in this valley. When Hebrew Roots launches, add "hebrew-roots" after "orthodox",
  // mid-block, where it draws no attention. Never make it the featured or the last tile.
  { id: "sec-christian", title: "False Christianity & competing claims", featured: "lds", slugs: ["jw", "lds", "unitarian", "oneness", "catholic", "orthodox", "progressive", "prosperity"] },
  { id: "sec-nonreligious", title: "Nonreligious worldviews", slugs: ["atheist", "agnostic", "humanist", "deist"] },
];
const JUMPS: [string, string][] = [
  ["sec-religions", "Religions"],
  ["sec-christian", "Christian claims"],
  ["sec-nonreligious", "Nonreligious"],
  ["sec-gospel", "Gospel"],
  ["sec-objections", "Objections"],
  ["sec-prepare", "Prepare"],
];

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

  return (
    <>
    <Welcome />
    <main className="page relative home-main" style={{ paddingTop: "calc(env(safe-area-inset-top) + 26px)" }}>
      <div className="home-glow" aria-hidden="true" />
      <header className="brand">
        <Mark size={52} />
        <div>
          <h1>
            Apologetics
            <br />
            Field Guide
          </h1>
        </div>
      </header>

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
                <span className="serif mt-2 block text-[20px] leading-[1.55]">
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
                      <span className="block text-[14px] font-semibold text-accent">{r.label}</span>
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
                          <span className="block text-[14px] font-semibold text-accent">{p.label}</span>
                          <span className="block">{p.title}</span>
                        </span>
                        <Chevron />
                      </Link>
                    ))}
                  </div>
                </section>
              )
          )}

          <nav className="jump" aria-label="Jump to a section">
            {JUMPS.map(([id, label]) => (
              <button key={id} type="button" className="jump-btn" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                {label}
              </button>
            ))}
          </nav>

          <h2 className="home-title">Who are you talking to?</h2>
          {FAMILIES.map((f) => {
            const found = f.slugs.map((slug) => groups.find((g) => g.slug === slug)).filter((g): g is GroupRow => !!g);
            // A featured group leads its section on a full-width tile. The rest follow in pairs,
            // and if that leaves one alone on the last row it widens too, so there's no gap.
            const lead = f.featured ? found.find((g) => g.slug === f.featured) : undefined;
            const list = lead ? [lead, ...found.filter((g) => g.slug !== lead.slug)] : found;
            const orphan = (list.length - (lead ? 1 : 0)) % 2 === 1;
            return (
              list.length > 0 && (
                <section key={f.id} id={f.id} className="home-sec" aria-label={f.title}>
                  <h3 className="label">{f.title}</h3>
                  <div className={lead ? "tiles has-featured" : "tiles"}>
                    {list.map((g, i) => (
                      <Link
                        key={g.slug}
                        href={`/${g.slug}`}
                        className={(lead && i === 0) || (orphan && i === list.length - 1) ? "tile tile-wide" : "tile"}
                      >
                        <span className="bar" style={{ background: g.color }} aria-hidden="true" />
                        <span>{g.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            );
          })}

          <section id="sec-gospel" className="home-sec" aria-label="The Gospel">
            <h3 className="label">The Gospel</h3>
            <nav className="rows">
            <Link href="/topic/the-gospel" className="row">
              <CrossIcon />
              <span>
                <span className="block text-[20px] font-semibold">The Gospel</span>
                <span className="sub">Where every conversation is headed</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-way-of-the-master" className="row">
              <TabletsIcon />
              <span>
                <span className="block text-[20px] font-semibold">The Way of the Master</span>
                <span className="sub">The Ten Commandments, then the cross</span>
              </span>
              <Chevron />
            </Link>
            </nav>
          </section>

          <section id="sec-objections" className="home-sec" aria-label="Common objections">
            <h3 className="label">Common objections</h3>
            <nav className="rows">
            <Link href="/topic/the-trinity" className="row">
              <TrinityIcon />
              <span>
                <span className="block text-[20px] font-semibold">The Trinity</span>
                <span className="sub">One God in three Persons</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/holy-spirit" className="row">
              <FlameIcon />
              <span>
                <span className="block text-[20px] font-semibold">The Holy Spirit</span>
                <span className="sub">Anyone denying the Trinity</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-resurrection" className="row">
              <TombIcon />
              <span>
                <span className="block text-[20px] font-semibold">The resurrection</span>
                <span className="sub">Historical evidence that Jesus rose</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-exclusivity-of-christ" className="row">
              <GateIcon />
              <span>
                <span className="block text-[20px] font-semibold">The exclusivity of Christ</span>
                <span className="sub">Why is Jesus the only way?</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-problem-of-evil" className="row">
              <StormIcon />
              <span>
                <span className="block text-[20px] font-semibold">The problem of evil</span>
                <span className="sub">Why does a good God allow suffering?</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/hell-and-eternal-judgment" className="row">
              <FireIcon />
              <span>
                <span className="block text-[20px] font-semibold">Hell and eternal judgment</span>
                <span className="sub">Why would a loving God send people to hell?</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-end-times" className="row">
              <HourglassIcon />
              <span>
                <span className="block text-[20px] font-semibold">The end times</span>
                <span className="sub">What is coming, and how to talk about it</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/morality-and-justice" className="row">
              <ScalesIcon />
              <span>
                <span className="block text-[20px] font-semibold">Morality and justice</span>
                <span className="sub">Can morality exist without God?</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/social-justice" className="row">
              <BannerIcon />
              <span>
                <span className="block text-[20px] font-semibold">Social justice</span>
                <span className="sub">What God requires, and what the word now means</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/cultural-marxism" className="row">
              <PyramidIcon />
              <span>
                <span className="block text-[20px] font-semibold">Cultural Marxism</span>
                <span className="sub">Where "oppressor and oppressed" came from</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/is-the-bible-reliable" className="row">
              <BookIcon />
              <span>
                <span className="block text-[20px] font-semibold">Is the Bible reliable?</span>
                <span className="sub">Manuscripts, eyewitnesses, prophecy</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/faith-and-reason" className="row">
              <MindIcon />
              <span>
                <span className="block text-[20px] font-semibold">Faith and reason</span>
                <span className="sub">Is believing in God irrational or blind faith?</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/worldviews-how-do-you-know" className="row">
              <TriangleIcon />
              <span>
                <span className="block text-[20px] font-semibold">Worldviews: how do you know?</span>
                <span className="sub">Presuppositions, and why unbelief can't stand</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-fallacy-of-evolution" className="row">
              <CreationIcon />
              <span>
                <span className="block text-[20px] font-semibold">The fallacy of evolution</span>
                <span className="sub">Why evolution cannot stand, and why creation is true</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/the-abolition-of-abortion" className="row">
              <LifeIcon />
              <span>
                <span className="block text-[20px] font-semibold">The abolition of abortion</span>
                <span className="sub">You shall not murder</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/macarthur-on-rome" className="row">
              <BookIcon />
              <span>
                <span className="block text-[20px] font-semibold">MacArthur on Rome</span>
                <span className="sub">His case against Roman Catholicism, in his words</span>
              </span>
              <Chevron />
            </Link>
            </nav>
          </section>

          <section id="sec-prepare" className="home-sec" aria-label="Prepare">
            <h3 className="label">Prepare</h3>
            <nav className="rows">
            <Link href="/method" className="row">
              <TargetIcon />
              <span>
                <span className="block text-[20px] font-semibold">The Method</span>
                <span className="sub">How to run the conversation</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/how-to-pray" className="row">
              <PrayIcon />
              <span>
                <span className="block text-[20px] font-semibold">How to pray</span>
                <span className="sub">Before, during and after every conversation</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/topic/words-they-use" className="row">
              <WordsIcon />
              <span>
                <span className="block text-[20px] font-semibold">Words they use</span>
                <span className="sub">Quick lookup for their terms</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/sideways" className="row">
              <DoorIcon />
              <span>
                <span className="block text-[20px] font-semibold">When it goes sideways</span>
                <span className="sub">How they leave, and what to do</span>
              </span>
              <Chevron />
            </Link>
            </nav>
          </section>

          <section id="sec-you" className="home-sec" aria-label="For you">
            <h3 className="label">For you</h3>
            <nav className="rows">
            <Link href="/train" className="row">
              <DrillIcon />
              <span>
                <span className="block text-[20px] font-semibold">Train</span>
                <span className="sub">Daily question, drills, memory verses{streak > 0 ? `, ${streak}-day streak` : ""}</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/testimony" className="row">
              <PenIcon />
              <span>
                <span className="block text-[20px] font-semibold">My testimony</span>
                <span className="sub">Your story in one minute</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/notes" className="row">
              <NoteIcon />
              <span>
                <span className="block text-[20px] font-semibold">Conversation notes</span>
                <span className="sub">Who you talked to and how to pray</span>
              </span>
              <Chevron />
            </Link>
            <Link href="/game" className="row">
              <GameIcon />
              <span>
                <span className="block text-[20px] font-semibold">Go and Tell</span>
                <span className="sub">A game, just for fun</span>
              </span>
              <Chevron />
            </Link>
            </nav>
          </section>

          <p className="mt-8 text-center">
            <Link href="/about" className="muted small inline-flex min-h-[48px] items-center px-4">
              About
            </Link>
          </p>
        </>
      )}

    </main>
    </>
  );
}
