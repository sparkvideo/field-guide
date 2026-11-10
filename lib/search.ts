// Searches the guide: objections, "if they say" lines, plays, quick cards, the Holy Spirit play, the Method.
// Exact phrases come first; Fuse.js then adds close matches (typos, partial words).

import Fuse from "fuse.js";
import items from "@/content/search-items.json";
import { normalize } from "./bible";

export type GuideItem = { kind: string; label: string; title: string; text: string; href: string; verses: string[] };

const ALL = items as GuideItem[];
const PREPARED = ALL.map((item) => ({
  item,
  title: " " + normalize(item.title) + " ",
  text: " " + normalize(item.text) + " ",
  verses: " " + normalize(item.verses.join(" ")) + " ",
}));

// What they SAY matters most, then plays, then everything else.
const KIND_BONUS: Record<string, number> = { objection: 30, branch: 30, play: 15, card: 5, "holy-spirit": 10, method: 0 };

let fuse: Fuse<GuideItem> | undefined;

export function searchGuide(query: string, limit = 12): GuideItem[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const phrase = " " + q + " ";
  const words = q.split(" ");
  const scored: { item: GuideItem; score: number }[] = [];

  for (const p of PREPARED) {
    let score = 0;
    if (p.title.includes(phrase)) score = 100;
    else if (p.title.includes(" " + q)) score = 80; // start of a word ("corrupt" finds "corrupted")
    else if (p.text.includes(phrase) || p.verses.includes(phrase)) score = 50;
    else if (words.length > 1 && words.every((w) => p.title.includes(" " + w) || p.text.includes(" " + w))) score = 30;
    if (score) scored.push({ item: p.item, score: score + (KIND_BONUS[p.item.kind] || 0) });
  }
  scored.sort((a, z) => z.score - a.score);
  const results = scored.map((s) => s.item);

  if (results.length < limit && q.length >= 4) {
    fuse ||= new Fuse(ALL, {
      keys: [
        { name: "title", weight: 2 },
        { name: "text", weight: 1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
    for (const r of fuse.search(query, { limit })) {
      if (!results.includes(r.item)) results.push(r.item);
    }
  }
  return results.slice(0, limit);
}
