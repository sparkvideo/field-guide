"use client";
// Quiz: what THEY say, and three possible answers taken from the guide. Pick the one that fits.
// After you pick, the right answer is shown with its verses.

import { useEffect, useState } from "react";
import type { PracticeCard } from "@/lib/practice";
import { Md } from "./Md";
import { VerseChips } from "./VerseSheet";

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Question = { card: PracticeCard; options: string[] };

function build(cards: PracticeCard[]): Question[] {
  return shuffle(cards).map((card) => {
    const others = shuffle([...new Set(cards.map((c) => c.youSay))].filter((t) => t !== card.youSay)).slice(0, 2);
    return { card, options: shuffle([card.youSay, ...others]) };
  });
}

export function Quiz({ cards }: { cards: PracticeCard[] }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);

  const restart = () => {
    setQuestions(build(cards));
    setAt(0);
    setPicked(null);
    setRight(0);
  };
  useEffect(restart, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!questions.length) return null;
  if (at >= questions.length) {
    return (
      <div className="mt-8">
        <p className="big">Done.</p>
        <p className="mt-2">
          {right} of {questions.length} right.
        </p>
        <button className="btn primary mt-8 w-full" onClick={restart}>
          Go again
        </button>
      </div>
    );
  }

  const q = questions[at];
  const pick = (option: string) => {
    if (picked) return;
    setPicked(option);
    if (option === q.card.youSay) setRight(right + 1);
  };

  return (
    <>
      <p className="muted small" aria-live="polite">
        {at + 1} of {questions.length} · {q.card.from}
      </p>
      <section className="mt-4">
        <h2 className="label">They say</h2>
        <p className="big">
          <Md text={q.card.theySay} />
        </p>
      </section>

      <section className="section" style={{ marginTop: 28 }}>
        <h2 className="label">Which answer fits?</h2>
        {q.options.map((option, i) => {
          const isRight = option === q.card.youSay;
          const state = !picked ? "" : isRight ? " right" : option === picked ? " wrong" : " dim";
          return (
            <button key={i} className={`option${state}`} onClick={() => pick(option)} disabled={!!picked} aria-label={picked ? (isRight ? "Correct answer" : "Not this one") : undefined}>
              <span className={picked && isRight ? "" : "line-clamp-4"}>
                <Md text={option} />
              </span>
            </button>
          );
        })}
      </section>

      {picked && (
        <>
          <p className="mt-2 font-semibold" role="status">
            {picked === q.card.youSay ? "Right." : "Not that one. The answer from the guide is outlined."}
          </p>
          <VerseChips verses={q.card.verses} context={q.card.youSay} />
          {q.card.askBack && (
            <p className="ask mt-5" style={{ fontSize: 19 }}>
              <Md text={q.card.askBack} />
            </p>
          )}
          <button
            className="btn primary mt-8 w-full"
            onClick={() => {
              setAt(at + 1);
              setPicked(null);
              window.scrollTo(0, 0);
            }}
          >
            Next
          </button>
        </>
      )}
    </>
  );
}
