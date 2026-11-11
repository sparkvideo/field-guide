"use client";
import { useState } from "react";

// A tappable picture of the four parts of prayer (A-C-T-S), with a guided "pray through it" mode.
const PARTS = [
  { letter: "A", word: "Adoration", line: "Praise God for who He is.", start: "Father, You are…", help: "Name one thing that is true of Him: holy, faithful, merciful, in control. Stay here before you ask for anything." },
  { letter: "C", word: "Confession", line: "Agree with God about your sin.", start: "I have sinned against You by…", help: "Be specific. Don't explain it or soften it. Then thank Him that the blood of Christ covers it." },
  { letter: "T", word: "Thanksgiving", line: "Thank Him for what He has done.", start: "Thank You for…", help: "Start with the cross. Then today's mercies: breath, bread, your wife, your church, the person you get to speak to." },
  { letter: "S", word: "Supplication", line: "Ask. Others first, then yourself.", start: "Please…", help: "Pray by name for the one you want to see saved. Ask for boldness, clear words and love. End with \"Your will be done.\"" },
];

export default function ActsPrayer() {
  const [open, setOpen] = useState<number | null>(null);
  const [guided, setGuided] = useState(false);
  const step = (n: number) => setOpen(n);

  return (
    <section className="acts" aria-label="The four parts of prayer">
      <h2 className="acts-title serif">Four parts of prayer</h2>
      <p className="sub">Read the letters down. Tap one to see how to start.</p>
      <ol className="acts-list">
        {PARTS.map((p, i) => {
          const on = open === i;
          return (
            <li key={p.letter} className={on ? "on" : undefined}>
              <button type="button" className="acts-row" aria-expanded={on} onClick={() => (setGuided(false), setOpen(on ? null : i))}>
                <span className="acts-letter serif" aria-hidden="true">{p.letter}</span>
                <span>
                  <span className="acts-word">{p.word}</span>
                  <span className="acts-line">{p.line}</span>
                </span>
              </button>
              {on && (
                <div className="acts-body">
                  <p className="acts-start serif">&ldquo;{p.start}&rdquo;</p>
                  <p>{p.help}</p>
                  {guided && (
                    <button type="button" className="btn primary mt-3" onClick={() => (i < PARTS.length - 1 ? step(i + 1) : (setGuided(false), setOpen(null)))}>
                      {i < PARTS.length - 1 ? `Next: ${PARTS[i + 1].word}` : "Amen"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!guided && (
        <button type="button" className="btn primary mt-4" onClick={() => (setGuided(true), setOpen(0))}>
          Pray through it now
        </button>
      )}
    </section>
  );
}
