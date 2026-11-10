"use client";
// The list of objections for a group, with a box to narrow it down as you type.

import Link from "next/link";
import { useState } from "react";
import { Chevron } from "./Bits";
import { Md } from "./Md";

export function ObjectionList({ slug, items }: { slug: string; items: { id: string; text: string }[] }) {
  const [filter, setFilter] = useState("");
  const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = items.filter((o) => words.every((w) => o.text.toLowerCase().includes(w)));
  return (
    <>
      <div className="search" style={{ height: 48, marginBottom: 12 }}>
        <input
          type="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="Narrow the list"
          placeholder={`Narrow ${items.length} objections…`}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {shown.length > 0 ? (
        <div className="rows">
          {shown.map((o) => (
            <Link key={o.id} href={`/${slug}/objection/${o.id}`} className="row">
              <span>
                <Md text={o.text} />
              </span>
              <Chevron />
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">Nothing matches. Try the search on Home.</p>
      )}
    </>
  );
}
