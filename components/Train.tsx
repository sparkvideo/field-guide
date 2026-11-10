"use client";
// Train: one question a day (with a streak), plus drills for each group.

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PracticeCard } from "@/lib/practice";
import { Chevron } from "./Bits";
import { CardFace } from "./Practice";

const KEY = "fg-streak";
type Streak = { last: string; count: number };

const dayNumber = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
const dayKey = (n: number) => String(n);

export function readStreak(): Streak {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null") as Streak | null;
    if (!s) return { last: "", count: 0 };
    const today = dayNumber();
    // still alive if answered today or yesterday
    return Number(s.last) >= today - 1 ? s : { last: s.last, count: 0 };
  } catch {
    return { last: "", count: 0 };
  }
}

export function Train({ cards, groups }: { cards: PracticeCard[]; groups: { slug: string; name: string; color: string; count: number }[] }) {
  const [today, setToday] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState<Streak>({ last: "", count: 0 });

  useEffect(() => {
    setToday(dayNumber());
    setStreak(readStreak());
  }, []);

  if (today === null) return null;
  // a different card each day, stepping through the whole guide before repeating
  const step = [37, 41, 43, 47, 53].find((p) => cards.length % p !== 0) || 1;
  const card = cards[(today * step) % cards.length];
  const doneToday = streak.last === dayKey(today);

  const reveal = () => {
    setOpen(true);
    if (doneToday) return;
    const next = { last: dayKey(today), count: streak.count + 1 };
    setStreak(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <>
      <section className="rows mt-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="label" style={{ margin: 0 }}>
            Today&rsquo;s question · {card.group}
          </h2>
          {streak.count > 0 && (
            <span className="small ml-3 whitespace-nowrap font-semibold" aria-label={`${streak.count} day streak`}>
              {streak.count}-day streak
            </span>
          )}
        </div>
        <CardFace card={card} open={open} />
        {!open && (
          <button className="btn primary mt-6 w-full" onClick={reveal}>
            {doneToday ? "Show the answer again" : "Answer in your head, then tap"}
          </button>
        )}
      </section>

      <section className="section">
        <h2 className="label">Drill</h2>
        <div className="rows">
          {groups.map((g) => (
            <Link key={g.slug} href={`/${g.slug}/practice`} className="row">
              <span className="bar" style={{ background: g.color }} aria-hidden="true" />
              <span>
                <span className="block font-semibold">{g.name}</span>
                <span className="sub">{g.count} cards</span>
              </span>
              <Chevron />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
