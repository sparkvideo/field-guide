"use client";
// Memory drill: see the reference, say the verse from memory, flip, grade yourself.

import { useEffect, useState } from "react";
import { useKeepAwake } from "./KeepAwake";

type Verse = { key: string; ref: string; uses: number };
type Text = { text: string; version: "LSB" | "BSB" };

export function MemoryVerses({ verses }: { verses: Verse[] }) {
  const [texts, setTexts] = useState<Record<string, Text> | null>(null);
  const [queue, setQueue] = useState<number[]>(() => verses.map((_, i) => i));
  const [open, setOpen] = useState(false);
  const [missed, setMissed] = useState(0);
  useKeepAwake();

  useEffect(() => {
    Promise.all([import("@/content/lsb-verses.json"), import("@/content/guide-verses.json")]).then(([l, b]) => {
      const lsb = Object.fromEntries((l.default as { key: string; text: string }[]).map((x) => [x.key, x.text.trim()]));
      const bsb = b.default as unknown as Record<string, { bsb: [number, string][] }>;
      const out: Record<string, Text> = {};
      for (const v of verses) {
        out[v.key] = lsb[v.key]
          ? { text: lsb[v.key], version: "LSB" }
          : { text: (bsb[v.key]?.bsb || []).map(([, t]) => t).join(" "), version: "BSB" };
      }
      setTexts(out);
    });
  }, [verses]);

  if (!queue.length) {
    return (
      <div className="mt-8">
        <p className="big">Done.</p>
        <p className="mt-2">
          {verses.length} verses, {missed} missed along the way.
        </p>
        <button
          className="btn primary mt-8 w-full"
          onClick={() => {
            setQueue(verses.map((_, i) => i));
            setMissed(0);
          }}
        >
          Go again
        </button>
      </div>
    );
  }

  const v = verses[queue[0]];
  const t = texts?.[v.key];
  const grade = (gotIt: boolean) => {
    if (gotIt) setQueue(queue.slice(1));
    else {
      setMissed(missed + 1);
      setQueue([...queue.slice(1), queue[0]]);
    }
    setOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <p className="muted small" aria-live="polite">
        {queue.length} left · cited {v.uses} times in the guide
      </p>
      <p className="big mt-4">{v.ref}</p>
      {open && t ? (
        <>
          <p className="serif mt-5 text-[22px] leading-[1.5]">{t.text}</p>
          <p className="mt-3">
            <span className="tag">{t.version}</span>
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button className="btn" onClick={() => grade(false)}>
              Missed it
            </button>
            <button className="btn primary" onClick={() => grade(true)}>
              Got it
            </button>
          </div>
        </>
      ) : (
        <button className="btn primary mt-8 w-full" onClick={() => setOpen(true)} disabled={!t}>
          Say it from memory, then tap
        </button>
      )}
    </>
  );
}
