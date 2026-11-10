"use client";
// Drill mode: read what THEY say, answer from memory, flip the card, then grade yourself.
// Cards you miss come back around until you get them. Uses only lines already in the guide.

import { useEffect, useState } from "react";
import type { PracticeCard } from "@/lib/practice";
import { useKeepAwake } from "./KeepAwake";
import { Md } from "./Md";
import { VerseChips } from "./VerseSheet";

function shuffled(n: number): number[] {
  const list = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function CardFace({ card, open }: { card: PracticeCard; open: boolean }) {
  return (
    <>
      <section className="mt-4">
        <h2 className="label">They say</h2>
        <p className="big">
          <Md text={card.theySay} />
        </p>
      </section>
      {open && (
        <section className="section" style={{ marginTop: 28 }}>
          <h2 className="label">You say</h2>
          <p className="text-[20px]">
            <Md text={card.youSay} />
          </p>
          <VerseChips verses={card.verses} context={card.youSay} />
          {card.askBack && (
            <p className="ask mt-5">
              <Md text={card.askBack} />
            </p>
          )}
        </section>
      )}
    </>
  );
}

export function Practice({ cards }: { cards: PracticeCard[] }) {
  const [queue, setQueue] = useState<number[]>(() => cards.map((_, i) => i));
  const [open, setOpen] = useState(false);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  useKeepAwake();

  const restart = () => {
    setQueue(shuffled(cards.length));
    setMissed(new Set());
    setOpen(false);
  };
  useEffect(restart, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!queue.length) {
    const firstTry = cards.length - missed.size;
    return (
      <div className="mt-8">
        <p className="big">Done.</p>
        <p className="mt-2">
          {firstTry} of {cards.length} right the first time.
        </p>
        <button className="btn primary mt-8 w-full" onClick={restart}>
          Go again
        </button>
      </div>
    );
  }

  const current = queue[0];
  const card = cards[current];
  const grade = (gotIt: boolean) => {
    if (gotIt) setQueue(queue.slice(1));
    else {
      setMissed(new Set(missed).add(current));
      setQueue([...queue.slice(1), current]); // comes back at the end
    }
    setOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <p className="muted small" aria-live="polite">
        {queue.length} left · {card.from}
      </p>
      <CardFace card={card} open={open} />
      {open ? (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button className="btn" onClick={() => grade(false)}>
            Missed it
          </button>
          <button className="btn primary" onClick={() => grade(true)}>
            Got it
          </button>
        </div>
      ) : (
        <button className="btn primary mt-8 w-full" onClick={() => setOpen(true)}>
          Show the answer
        </button>
      )}
    </>
  );
}
