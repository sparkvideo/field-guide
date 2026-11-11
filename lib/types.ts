// The shape of content/guide.json (built from the markdown by scripts/parse-guide.ts).
// All "text" fields are small markdown strings (**bold**, *italic*, ➕ kept as written).
// ▶ video links are pulled OUT of the text and stored in `links`, so the screen stays clean.

export type VideoLink = { videoId: string; seconds: number; url: string; label?: string };

export type VerseRef = {
  label: string; // as shown on the chip: "Isa 44:6", "Q 5:47", "Alma 11:28–29"
  kind: "bible" | "quran" | "bom" | "dc" | "jst" | "hadith";
  key: string; // unique id: "isaiah.44.6", "john.1.1-3", "psalms.95" (whole chapter), "q.5.47"
  book?: string; // bible only: file slug ("isaiah")
  chapter?: number;
  verseStart?: number; // missing = whole chapter
  verseEnd?: number;
  chapterEnd?: number; // only for chapter ranges like "Isaiah 43–45"
};

/** Carried by every piece of content: the verses in it, its video links, and whether it has a ➕. */
export type Meta = {
  verses: VerseRef[];
  links: VideoLink[];
  supplemental: boolean; // ➕ verify before use
  crossRef?: "holy-spirit";
};

/** A line of content. */
export type Line = Meta & { text: string };

export type Labeled = Line & { label?: string }; // e.g. label "Get this first", "Trap", "Contrast"
export type Step = Labeled & { phase?: string }; // phase = "Phase 1: plain text only…"
export type Branch = Meta & { theySay: string; youSay: string };
export type Note = Line & { kind: "warning" | "quote" };

export type Play = {
  id: string; // "play-1"
  number: number;
  title: string;
  subtitle?: string; // the part in (parentheses) after the title
  whenToUse?: string; // set when the subtitle is a usage hint ("lead with this")
  warning: boolean; // ⚠️ on the title
  supplemental: boolean; // ➕ anywhere in the play
  summary?: Line; // "The logic: …"
  lead?: Line; // "→ Run the full Holy Spirit Play …"
  opener?: Line;
  altOpeners: Line[]; // "Or open with:" other first lines for the same play
  chain: Step[];
  questions: Line[];
  ifTheySay: Branch[];
  closer?: Line;
  notes: Note[];
  links: VideoLink[]; // every link in the play, in order (for "Watch an example")
  crossRef?: "holy-spirit";
};

export type Objection = Meta & {
  id: string; // url slug
  objection: string; // what THEY say
  response: string; // what YOU say
  goTo: string; // the "Go to" cell as written
  askBack?: string;
};

export type Group = {
  slug: "jw" | "unitarian" | "lds" | "muslim" | "catholic" | "orthodox" | "atheist" | "oneness" | "progressive" | "jewish" | "hindu" | "buddhist" | "new-age" | "agnostic" | "humanist" | "deist" | "hebrew-roots";
  name: string;
  heading: string; // heading as written in the markdown
  color: string;
  emoji: string;
  beliefs?: Line; // "What they believe"
  lead: Labeled[]; // the other intro lines (Get this first, Their weak spot, Approach, Mindset…)
  cheatCardTitle: string;
  cheatCard: Line[];
  offense: Play[];
  defense: Objection[];
  exits?: { label: string; items: Line[] }; // "Typical exits"
};

export type HolySpiritPlay = {
  title: string;
  intro: Line;
  stepA: {
    title: string;
    opener: Line;
    rows: (Meta & { goTo: string; point: string; question: string })[];
    ifTheySay: Branch[];
  };
  stepB: {
    title: string;
    structure: Line;
    // pair = OT text above NT text. single = one passage (not an OT→NT pair).
    rows: (Meta & { kind: "pair" | "single"; first: string; firstVerses: VerseRef[]; second: string; secondVerses: VerseRef[]; note: string })[];
    otOnly: Labeled;
    ifTheySay: Branch[];
    closer: Line;
  };
};

/** A page under "For any conversation" (The Gospel, The Trinity…), written in content/extras.md. */
export type Topic = {
  slug: string;
  title: string;
  subtitle?: string;
  intro: Line[];
  sections: { heading: string; lines: Labeled[] }[];
};

export type Guide = {
  title: string;
  intro: Line[];
  method: {
    title: string;
    intro: Line;
    moves: (Line & { number: number; title: string })[];
    toolsTitle: string;
    universalTools: (Line & { title: string })[];
  };
  holySpiritPlay: HolySpiritPlay;
  groups: Group[];
  topics: Topic[];
  videos: { id: string; title: string; topic: string; url: string }[];
  footnote?: Line;
};
