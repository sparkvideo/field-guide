// Turns content/field_guide_apologetics.md into content/guide.json.
//
// Run with: npm run parse
//
// It also writes:
//   content/lsb-verses.json   one empty slot per cited Bible reference (text you already filled in is kept)
//   content/lsb-todo.md       the list of slots still empty
//   content/parse-report.md   what was found, and anything that could not be placed
//
// Nothing in the guide is rewritten. The parser only sorts lines into boxes.

import fs from "fs";
import path from "path";
import { BOOKS, isOldTestament } from "../lib/books";
import type {
  Branch, Group, Guide, HolySpiritPlay, Labeled, Line, Meta, Note, Objection, Play, Step, VerseRef, VideoLink,
} from "../lib/types";
import { bareRefs, extractRefs } from "./refs";

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const SOURCE = path.join(CONTENT, "field_guide_apologetics.md");

const source = fs.readFileSync(SOURCE, "utf8").replace(/\r\n/g, "\n");
const lines = source.split("\n");

// ───────────────────────── bookkeeping (so nothing gets dropped) ─────────────────────────

const used = new Set<number>(); // line numbers that were placed somewhere
const flags: string[] = []; // things for Charlie to look at
const bare: { where: string; found: string }[] = [];
let linkCount = 0;
let plusCount = 0;
let titlePlus = 0;
const structural: string[] = []; // labels the app replaces with its own headings ("Opener", "Chain"…)

type L = { n: number; s: string };
const take = (l: L) => (used.add(l.n), l.s);

// ───────────────────────── small helpers ─────────────────────────

const LINK = /\[▶([^\]]*)\]\((https:\/\/youtu\.be\/([\w-]+)(?:\?t=(\d+))?)\)/;
const LINK_GROUP = new RegExp(`\\s*\\(\\s*${LINK.source}(?:\\s*,\\s*${LINK.source})*\\s*\\)`, "g");
const LINK_ALL = new RegExp(LINK.source, "g");

/** Pulls ▶ links out of a piece of text. */
function stripLinks(text: string): { text: string; links: VideoLink[] } {
  const links: VideoLink[] = [];
  const collect = (chunk: string) => {
    for (const m of chunk.matchAll(LINK_ALL)) {
      const label = m[1].trim();
      links.push({ videoId: m[3], seconds: Number(m[4] ?? 0), url: m[2], ...(label ? { label } : {}) });
    }
    return "";
  };
  let out = text.replace(LINK_GROUP, collect).replace(LINK_ALL, collect);
  out = out.replace(/[ \t]{2,}/g, " ").replace(/ ([.,;:)])/g, "$1").trim();
  linkCount += links.length;
  return { text: out, links };
}

// A few lines give chapter:verse with no book name ("(8:6)"). The book is clear from the lines around them.
const BARE_BOOK: Record<string, string> = {
  "Jehovah's Witness objection 1": "John",
  "Unitarian Play 3": "1 Cor",
  "Muslim Play 1": "Q",
};

/** Builds the common info for a piece of text. Every piece of guide text goes through here exactly once. */
function meta(raw: string, where: string, opts: { explainsPlus?: boolean } = {}): Meta & { text: string } {
  const { text, links } = stripLinks(raw);
  const plus = (text.match(/➕/g) || []).length;
  plusCount += plus;
  const verses = extractRefs(text);
  for (const b of bareRefs(text)) {
    const book = BARE_BOOK[where];
    if (!book) bare.push({ where, found: b });
    else for (const r of extractRefs(`${book} ${b}`)) if (!verses.some((v) => v.key === r.key)) verses.push(r);
  }
  const m: Meta & { text: string } = {
    text,
    verses,
    links,
    supplemental: plus > 0 && !opts.explainsPlus,
  };
  if (text.includes("(#holy-spirit-play)")) m.crossRef = "holy-spirit";
  return m;
}

const line = (raw: string, where: string, opts?: { explainsPlus?: boolean }): Line => meta(raw, where, opts);

/** Merges several pieces into one Meta (used for table rows). */
function merge(parts: Meta[]): Meta {
  const verses: VerseRef[] = [];
  const seen = new Set<string>();
  for (const p of parts) for (const v of p.verses) if (!seen.has(v.key)) (seen.add(v.key), verses.push(v));
  const m: Meta = {
    verses,
    links: parts.flatMap((p) => p.links),
    supplemental: parts.some((p) => p.supplemental),
  };
  if (parts.some((p) => p.crossRef)) m.crossRef = "holy-spirit";
  return m;
}

/** "**Opener:** text" -> { label: "Opener", rest: "text" } */
function splitLabel(t: string): { label?: string; rest: string } {
  let m = t.match(/^(➕\s*)?\*\*([^*]+?):\*\*\s*([\s\S]*)$/);
  if (m) return { label: m[2].trim(), rest: (m[1] ? "➕ " : "") + m[3] };
  m = t.match(/^\*\*(If they say)(?: →)?\*\*\s*([\s\S]*)$/);
  if (m) return { label: m[1], rest: m[2] };
  m = t.match(/^\*\*(Phase \d+:[^*]+)\*\*\s*([\s\S]*)$/);
  if (m) return { label: m[1].trim(), rest: m[2] };
  m = t.match(/^\*\*([^*:]+):\s+([^*]+)\*\*\s*([\s\S]*)$/); // "**Signature weapon: THE ISLAMIC DILEMMA.** It's…"
  if (m) return { label: m[1].trim(), rest: `**${m[2]}** ${m[3]}`.trim() };
  return { rest: t };
}

/** '*"they say"* → you say' */
function branch(raw: string, where: string): Branch {
  const m = meta(raw, where);
  const { text, ...rest } = m;
  let i = text.indexOf(" → ");
  let theySay: string;
  let youSay: string;
  if (i >= 0) {
    theySay = text.slice(0, i).trim();
    youSay = text.slice(i + 3).trim();
  } else if ((i = text.indexOf("): ")) >= 0) {
    theySay = text.slice(0, i + 1).trim();
    youSay = text.slice(i + 3).trim();
  } else {
    theySay = text;
    youSay = "";
    flags.push(`${where}: an "If they say" line has no "→", so it could not be split into they-say / you-say: "${text.slice(0, 70)}…"`);
  }
  theySay = theySay.replace(/^\*\*(.*)\*\*$/, "$1");
  return { theySay, youSay, ...rest };
}

function parseTable(rows: L[]): { header: string[]; rows: string[][] } {
  const cells = (s: string) => s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const header = cells(take(rows[0]));
  take(rows[1]);
  structural.push(...header);
  return { header, rows: rows.slice(2).map((r) => cells(take(r))) };
}

// A line and the lines nested under it.
type Entry = { kind: "bullet" | "num" | "para" | "quote"; text: string; children: Entry[] };

function toEntries(ls: L[]): Entry[] {
  const top: Entry[] = [];
  const stack: { indent: number; entry: Entry }[] = [];
  let last: Entry | undefined;
  let blankSince = true;
  let adopting: Entry | undefined; // "**If they say →**" owns the bullets right under it

  for (const l of ls) {
    if (!l.s.trim()) {
      blankSince = true;
      adopting = undefined;
      continue;
    }
    if (/^\s*\|/.test(l.s) || /^#{1,6} /.test(l.s)) continue; // tables and headings are handled elsewhere
    if (/^---\s*$/.test(l.s) || /^<a id="[^"]+"><\/a>\s*$/.test(l.s)) continue; // rules and anchors
    const indent = l.s.match(/^ */)![0].length;
    const body = l.s.trim();
    let kind: Entry["kind"] = "para";
    let text = body;
    let m: RegExpMatchArray | null;
    if ((m = body.match(/^- (.*)$/))) (kind = "bullet"), (text = m[1]);
    else if ((m = body.match(/^(\d+)\. (.*)$/))) (kind = "num"), (text = m[2]), structural.push(m[1]);
    else if ((m = body.match(/^> ?(.*)$/))) (kind = "quote"), (text = m[1]);
    take(l);

    if (kind === "para" && indent > 0 && last) {
      last.text += " " + text; // continuation of the line above
      continue;
    }
    if (kind === "quote" && last?.kind === "quote" && !blankSince) {
      last.text += "\n" + text;
      continue;
    }
    const entry: Entry = { kind, text, children: [] };
    let effective = indent;
    if (indent === 0 && (kind === "bullet" || kind === "num") && adopting) effective = 2;
    while (stack.length && stack[stack.length - 1].indent >= effective) stack.pop();
    if (stack.length) stack[stack.length - 1].entry.children.push(entry);
    else top.push(entry);
    stack.push({ indent: effective, entry });
    if (indent === 0 && kind === "para") {
      adopting = /^\*\*(If they say →|Phase \d+:[^*]*)\*\*/.test(text) ? entry : undefined;
    }
    last = entry;
    blankSince = false;
  }
  return top;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[*"“”'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ───────────────────────── split the file into sections ─────────────────────────

type Section = { heading: string; level: number; body: L[] };
const sections: Section[] = [];
const preamble: L[] = [];
{
  let current: Section | undefined;
  lines.forEach((s, n) => {
    const l = { n, s };
    if (!s.trim() || /^---\s*$/.test(s) || /^<a id="[^"]+"><\/a>\s*$/.test(s)) used.add(n); // blank, rule, anchor
    const m = s.match(/^(#{1,2}) (.*)$/);
    if (m && !(n === 0)) {
      current = { heading: m[2].trim(), level: m[1].length, body: [] };
      sections.push(current);
      used.add(n);
    } else if (current) current.body.push(l);
    else preamble.push(l);
  });
}
const find = (re: RegExp) => {
  const s = sections.find((x) => re.test(x.heading));
  if (!s) throw new Error(`Section not found: ${re}`);
  return s;
};

/** Splits a section's lines at "### " or "#### " headings. */
function splitAt(ls: L[], level: 3 | 4): { heading?: string; body: L[] }[] {
  const out: { heading?: string; body: L[] }[] = [{ body: [] }];
  const re = new RegExp(`^${"#".repeat(level)} (.*)$`);
  for (const l of ls) {
    const m = l.s.match(re);
    if (m) (used.add(l.n), out.push({ heading: m[1].trim(), body: [] }));
    else out[out.length - 1].body.push(l);
  }
  return out;
}

// ───────────────────────── top of the file ─────────────────────────

const title = take(preamble[0]).replace(/^# /, "").replace(/^[^\w]+/, "").trim();
const intro: Line[] = toEntries(preamble.slice(1)).map((e) => line(e.text, "Intro", { explainsPlus: true }));

// Quick Jump: the app's own navigation replaces it.
for (const l of find(/Quick Jump/).body) used.add(l.n);

// ───────────────────────── The Method ─────────────────────────

function parseMethod(): Guide["method"] {
  const sec = find(/The Method/);
  const [main, tools] = splitAt(sec.body, 3);
  const entries = toEntries(main.body);
  const introEntry = entries.find((e) => e.kind === "para")!;
  const moves = entries
    .filter((e) => e.kind === "num")
    .map((e, i) => {
      const m = e.text.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/)!;
      const where = `Method move ${i + 1}`;
      const t = line(m[1], where);
      const body = line(m[2], where);
      return { number: i + 1, title: t.text, ...merge([t, body]), text: body.text };
    });
  const universalTools = toEntries(tools.body).map((e, i) => {
    const m = e.text.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/)!;
    const where = `Universal tool ${i + 1}`;
    const t = line(m[1], where);
    const body = line(m[2], where);
    return { title: t.text, ...merge([t, body]), text: body.text };
  });
  return {
    title: sec.heading,
    intro: line(introEntry.text, "Method intro"),
    moves,
    toolsTitle: tools.heading!,
    universalTools,
  };
}

// ───────────────────────── The Holy Spirit Play ─────────────────────────

function tableLines(ls: L[]): L[] {
  return ls.filter((l) => /^\s*\|/.test(l.s));
}

function parseHolySpirit(): HolySpiritPlay {
  const sec = find(/HOLY SPIRIT PLAY/);
  const [head, a, b] = splitAt(sec.body, 3);
  const W = "Holy Spirit Play";

  const introEntry = toEntries(head.body)[0];

  // Step A
  const aEntries = toEntries(a.body);
  const aTable = parseTable(tableLines(a.body));
  let aOpener: Line | undefined;
  let aBranches: Branch[] = [];
  for (const e of aEntries) {
    const { label, rest } = splitLabel(e.text);
    if (label === "Opener") (structural.push(label), (aOpener = line(rest, `${W} A opener`)));
    else if (label === "If they say")
      (structural.push(label), (aBranches = e.children.map((c) => branch(c.text, `${W} A`))));
    else flags.push(`${W} Step A: line not recognised: "${e.text.slice(0, 60)}…"`);
  }
  const aRows = aTable.rows.map((r, i) => {
    const parts = r.map((c) => meta(c, `${W} A row ${i + 1}`));
    return { goTo: parts[0].text, point: parts[1].text, question: parts[2].text, ...merge(parts) };
  });

  // Step B
  const bEntries = toEntries(b.body);
  const bTable = parseTable(tableLines(b.body));
  let structure: Line | undefined;
  let otOnly: Labeled | undefined;
  let bBranches: Branch[] = [];
  let closer: Line | undefined;
  for (const e of bEntries) {
    const { label, rest } = splitLabel(e.text);
    if (label === "The structure") (structural.push(label), (structure = line(rest, `${W} B structure`)));
    else if (label?.startsWith("Old Testament only")) otOnly = { label, ...line(rest, `${W} B OT-only`) };
    else if (label === "If they say")
      (structural.push(label), (bBranches = e.children.map((c) => branch(c.text, `${W} B`))));
    else if (label === "Closer") (structural.push(label), (closer = line(rest, `${W} B closer`)));
    else flags.push(`${W} Step B: line not recognised: "${e.text.slice(0, 60)}…"`);
  }
  const bRows = bTable.rows.map((r, i) => {
    const parts = r.map((c) => meta(c, `${W} B row ${i + 1}`));
    const firstRef = parts[0].verses.find((v) => v.kind === "bible");
    const pair = !!firstRef && isOldTestament(firstRef.book!) && parts[1].verses.some((v) => v.kind === "bible");
    if (!pair)
      flags.push(
        `${W} Step B, row ${i + 1} ("${parts[0].text.replace(/\*/g, "").slice(0, 40)}…") is not an Old Testament → New Testament pair, so the app will show it as a single passage instead of stacking "Old Testament / New Testament".`
      );
    return {
      kind: pair ? ("pair" as const) : ("single" as const),
      first: parts[0].text,
      firstVerses: parts[0].verses,
      second: parts[1].text,
      secondVerses: parts[1].verses,
      note: parts[2].text,
      ...merge(parts),
    };
  });

  return {
    title: sec.heading,
    intro: line(introEntry.text, `${W} intro`),
    stepA: { title: a.heading!, opener: aOpener!, rows: aRows, ifTheySay: aBranches },
    stepB: { title: b.heading!, structure: structure!, rows: bRows, otOnly: otOnly!, ifTheySay: bBranches, closer: closer! },
  };
}

// ───────────────────────── Groups ─────────────────────────

const GROUPS: { match: RegExp; slug: Group["slug"]; name: string; color: string }[] = [
  { match: /JEHOVAH/, slug: "jw", name: "Jehovah's Witness", color: "#2563eb" },
  { match: /UNITARIAN/, slug: "unitarian", name: "Unitarian", color: "#16a34a" },
  { match: /MORMON/, slug: "lds", name: "Mormon", color: "#ca8a04" },
  { match: /MUSLIM/, slug: "muslim", name: "Muslim", color: "#dc2626" },
  { match: /ATHEIST/, slug: "atheist", name: "Atheist", color: "#a3a3ad" },
];

function parsePlay(heading: string, body: L[], groupName: string): Play {
  const hm = heading.match(/^(⚠️\s*)?PLAY (\d+):\s*(.*)$/);
  if (!hm) throw new Error(`Play heading not understood: ${heading}`);
  const number = Number(hm[2]);
  structural.push("PLAY", String(number));
  const where = `${groupName} Play ${number}`;
  const titleMeta = meta(hm[3], `${where} title`);
  let playTitle = titleMeta.text.replace(/^➕\s*/, "");
  if (playTitle !== titleMeta.text) titlePlus++; // the ➕ on a title becomes the play's "supplemental" flag
  let subtitle: string | undefined;
  const pm = playTitle.match(/^(.*?)\s*\(([^()]*)\)$/);
  if (pm) (playTitle = pm[1]), (subtitle = pm[2]);

  const play: Play = {
    id: `play-${number}`,
    number,
    title: playTitle,
    ...(subtitle ? { subtitle } : {}),
    ...(subtitle && /^(use |lead |only |run )/i.test(subtitle) ? { whenToUse: subtitle } : {}),
    warning: !!hm[1],
    supplemental: titleMeta.supplemental,
    chain: [],
    questions: [],
    ifTheySay: [],
    notes: [],
    links: [],
  };

  const step = (raw: string, label?: string, phase?: string) => {
    const s: Step = { ...(label ? { label } : {}), ...(phase ? { phase } : {}), ...line(raw, where) };
    play.chain.push(s);
  };

  for (const e of toEntries(body)) {
    if (e.kind === "quote") {
      play.notes.push({ kind: "quote", ...line(e.text, where) });
      continue;
    }
    if (e.text.startsWith("⚠️")) {
      play.notes.push({ kind: "warning", ...line(e.text, where) });
      continue;
    }
    if (e.text.startsWith("→") && e.text.includes("(#holy-spirit-play)")) {
      play.lead = line(e.text, where);
      continue;
    }
    const { label, rest } = splitLabel(e.text);
    if (label === "Opener") {
      structural.push(label);
      play.opener = line(rest, where);
    } else if (label === "Chain") {
      structural.push(label);
      if (e.children.length) e.children.forEach((c) => step(c.text));
      else rest.split(/ → /).forEach((part) => step(part));
    } else if (label === "If they say") {
      structural.push(label);
      if (e.children.length) e.children.forEach((c) => play.ifTheySay.push(branch(c.text, where)));
      if (rest.trim()) play.ifTheySay.push(branch(rest, where));
    } else if (label === "Question" || label === "Questions") {
      structural.push(label);
      play.questions.push(line(rest, where));
    } else if (label === "Closer") {
      structural.push(label);
      play.closer = line(rest, where);
    } else if (label === "The logic") {
      structural.push(label);
      play.summary = line(rest, where);
    } else if (label?.startsWith("Phase ")) {
      const headerLinks = stripLinks(rest); // a ▶ link sitting on the phase heading
      play.links.push(...headerLinks.links);
      if (headerLinks.text) step(headerLinks.text, undefined, label);
      e.children.forEach((c) => step(c.text, undefined, label));
    } else {
      step(rest, label);
      e.children.forEach((c) => step(c.text));
    }
  }

  const parts: Meta[] = [
    ...(play.summary ? [play.summary] : []),
    ...(play.lead ? [play.lead] : []),
    ...(play.opener ? [play.opener] : []),
    ...play.chain,
    ...play.questions,
    ...play.ifTheySay,
    ...(play.closer ? [play.closer] : []),
    ...play.notes,
  ];
  play.links = [...titleMeta.links, ...play.links, ...parts.flatMap((p) => p.links)];
  play.supplemental = play.supplemental || parts.some((p) => p.supplemental);
  if (parts.some((p) => p.crossRef)) play.crossRef = "holy-spirit";
  return play;
}

function parseGroup(sec: Section): Group {
  const info = GROUPS.find((g) => g.match.test(sec.heading))!;
  const emoji = sec.heading.match(/^\S+/)![0];
  const parts = splitAt(sec.body, 3);
  const W = info.name;

  // Intro lines
  let beliefs: Line | undefined;
  const lead: Labeled[] = [];
  for (const e of toEntries(parts[0].body)) {
    const { label, rest } = splitLabel(e.text);
    if (label === "What they believe") (structural.push(label), (beliefs = line(rest, `${W} beliefs`)));
    else lead.push({ ...(label ? { label } : {}), ...line(rest, `${W} intro`, { explainsPlus: label === "Note" }) });
  }

  const card = parts.find((p) => /Cheat Card/.test(p.heading || ""))!;
  const offense = parts.find((p) => /OFFENSE/.test(p.heading || ""))!;
  const defense = parts.find((p) => /DEFENSE/.test(p.heading || ""))!;
  structural.push(offense.heading!, defense.heading!);

  const cheatCard = toEntries(card.body).map((e, i) => line(e.text, `${W} cheat card ${i + 1}`));

  const plays = splitAt(offense.body, 4)
    .filter((p) => p.heading)
    .map((p) => parsePlay(p.heading!, p.body, W));

  // Defense table
  const table = parseTable(tableLines(defense.body));
  const ids = new Set<string>();
  const objections: Objection[] = table.rows.map((r, i) => {
    const where = `${W} objection ${i + 1}`;
    const cells = r.map((c) => meta(c, where));
    const objection = cells[0].text.replace(/^\*\*([^*]*(?:\*[^*]+\*[^*]*)*)\*\*$/, "$1");
    const stop = new Set(["the", "a", "an", "is", "of", "to", "and", "in", "on", "so", "says", "say", "that", "be", "you", "i", "it", "s"]);
    const words = slugify(objection).split("-").filter((w) => !stop.has(w));
    let id = words.slice(0, 5).join("-");
    for (let k = 2; ids.has(id); k++) id = `${words.slice(0, 5).join("-")}-${k}`;
    ids.add(id);
    const merged = merge([cells[2], cells[1], cells[0], cells[3]]); // "Go to" verses first
    return {
      id,
      objection,
      response: cells[1].text,
      goTo: cells[2].text,
      ...(cells[3].text ? { askBack: cells[3].text } : {}),
      ...merged,
      links: cells.flatMap((c) => c.links),
    };
  });

  // "Typical exits"
  let exits: Group["exits"];
  for (const e of toEntries(defense.body)) {
    const { label, rest } = splitLabel(e.text);
    if (label?.startsWith("Typical exits"))
      exits = { label, items: rest.split(" · ").map((x) => line(x, `${W} exits`)) };
    else flags.push(`${W} defense: line not recognised: "${e.text.slice(0, 60)}…"`);
  }

  if (!beliefs)
    flags.push(`${W}: there is no "What they believe" line in the markdown. The group screen will show the "${lead.find((l) => l.label && l.label !== "Note")?.label}" line instead.`);

  return {
    slug: info.slug,
    name: info.name,
    heading: sec.heading.replace(/^\S+\s*/, ""),
    color: info.color,
    emoji,
    ...(beliefs ? { beliefs } : {}),
    lead,
    cheatCardTitle: card.heading!.replace(/^\S+\s*/, ""),
    cheatCard,
    offense: plays,
    defense: objections,
    ...(exits ? { exits } : {}),
  };
}

// ───────────────────────── Videos ─────────────────────────

function parseVideos(): { videos: Guide["videos"]; footnote?: Line } {
  const sec = find(/Video References/);
  const table = parseTable(tableLines(sec.body));
  const videos = table.rows.map((r) => {
    const m = r[1].match(/^\[(.*)\]\((https:\/\/youtu\.be\/([\w-]+))\)$/);
    if (!m) throw new Error(`Video row not understood: ${r[1]}`);
    return { id: m[3], title: m[1], topic: r[0], url: m[2] };
  });
  const foot = toEntries(sec.body)[0];
  return { videos, ...(foot ? { footnote: line(foot.text, "Footnote", { explainsPlus: true }) } : {}) };
}

// ───────────────────────── build ─────────────────────────

const method = parseMethod();
const holySpiritPlay = parseHolySpirit();
const groups = sections.filter((s) => s.level === 1 && GROUPS.some((g) => g.match.test(s.heading))).map(parseGroup);
const { videos, footnote } = parseVideos();

const guide: Guide = { title, intro, method, holySpiritPlay, groups, videos, ...(footnote ? { footnote } : {}) };
fs.writeFileSync(path.join(CONTENT, "guide.json"), JSON.stringify(guide, null, 2));

// ───────────────────────── checks ─────────────────────────

// 1) Lines that were never placed
const unplaced = lines.map((s, n) => ({ n, s })).filter((l) => !used.has(l.n));

// 2) Every ▶ and ➕ in the markdown made it into the JSON
const sourceLinks = (source.match(new RegExp(LINK.source, "g")) || []).length;
const sourcePlus = (source.match(/➕/g) || []).length;
const json = JSON.stringify(guide);
const jsonPlus = (json.match(/➕/g) || []).length;
const walkLinks = (o: unknown, key = ""): number =>
  Array.isArray(o)
    ? o.reduce((a: number, x) => a + walkLinks(x, key), 0)
    : o && typeof o === "object"
      ? "videoId" in (o as object)
        ? 1
        : Object.entries(o as object).reduce((a, [k, v]) => a + walkLinks(v, k), 0)
      : 0;
// play.links repeats the links of the play's own lines, so count plays separately
const jsonLinksAll = walkLinks(guide);
const playLinkRepeats = groups.reduce(
  (a, g) =>
    a +
    g.offense.reduce((b, p) => {
      const own = [p.summary, p.lead, p.opener, ...p.chain, ...p.questions, ...p.ifTheySay, p.closer, ...p.notes]
        .filter(Boolean)
        .reduce((c, x) => c + (x as Meta).links.length, 0);
      return b + own;
    }, 0),
  0
);
const jsonLinks = jsonLinksAll - playLinkRepeats;

// 3) Every word in the markdown is somewhere in the JSON
const words = (s: string) =>
  (s
    .replace(/\]\((?:https?:|#)[^)]*\)/g, "] ")
    .replace(/<a id="[^"]*"><\/a>/g, " ")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || []);
const bag = (list: string[]) => list.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map<string, number>());
const quickJump = new Set(find(/Quick Jump/).body.map((l) => l.n));
const sourceBag = bag(lines.filter((_, n) => !quickJump.has(n)).flatMap((s) => words(s)));
const strings: string[] = [];
const collect = (o: unknown, key = "") => {
  if (typeof o === "string") {
    if (!["url", "videoId", "key", "book", "slug", "color", "id", "kind"].includes(key)) strings.push(o);
  } else if (Array.isArray(o)) o.forEach((x) => collect(x, key));
  else if (o && typeof o === "object") {
    if ("videoId" in (o as object)) {
      const l = o as VideoLink;
      if (l.label) strings.push(l.label);
      return;
    }
    if ("key" in (o as object) && "label" in (o as object) && "kind" in (o as object)) return; // derived verse chips
    Object.entries(o as object).forEach(([k, v]) => collect(v, k));
  }
};
collect(guide);
strings.push(...structural, ...sections.map((s) => s.heading), ...videos.map((v) => v.id));
const jsonBag = bag(strings.flatMap((s) => words(s)));
const missingWords: string[] = [];
for (const [w, n] of sourceBag) {
  const have = jsonBag.get(w) || 0;
  if (have < n) missingWords.push(`${w} ×${n - have}`);
}

// 4) Video links point at videos listed in the Video References table
const listed = new Set(videos.map((v) => v.id));
const allLinks: VideoLink[] = [];
const gatherLinks = (o: unknown) => {
  if (Array.isArray(o)) o.forEach(gatherLinks);
  else if (o && typeof o === "object") {
    if ("videoId" in (o as object)) allLinks.push(o as VideoLink);
    else Object.values(o as object).forEach(gatherLinks);
  }
};
gatherLinks(guide);
const unlistedVideos = [...new Set(allLinks.map((l) => l.videoId))].filter((id) => !listed.has(id));
const unusedVideos = videos.filter((v) => !allLinks.some((l) => l.videoId === v.id));

// 5) Verses
const allRefs = new Map<string, VerseRef>();
const gatherRefs = (o: unknown) => {
  if (Array.isArray(o)) o.forEach(gatherRefs);
  else if (o && typeof o === "object") {
    const r = o as VerseRef;
    if (typeof r.key === "string" && typeof r.label === "string" && typeof r.kind === "string") allRefs.set(r.key, r);
    else Object.values(o as object).forEach(gatherRefs);
  }
};
gatherRefs(guide);
const refs = [...allRefs.values()];
const bibleRefs = refs.filter((r) => r.kind === "bible");
const order = (r: VerseRef) => BOOKS.findIndex((x) => x.slug === r.book) * 1e6 + r.chapter! * 1e3 + (r.verseStart || 0);
bibleRefs.sort((a, z) => order(a) - order(z));

type BookIndex = { slug: string; name: string; chapters: number[] }[];
const bibleIndexPath = path.join(ROOT, "public", "bible", "index.json");
const unresolved: string[] = [];
let bsbChecked = false;
const bsbText = (r: VerseRef): string => {
  const book = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "bible", `${r.book}.json`), "utf8"));
  return book.chapters[r.chapter! - 1].slice(r.verseStart! - 1, r.verseEnd!).join(" ");
};
if (fs.existsSync(bibleIndexPath)) {
  bsbChecked = true;
  const index: BookIndex = JSON.parse(fs.readFileSync(bibleIndexPath, "utf8"));
  for (const r of bibleRefs) {
    const book = index.find((x) => x.slug === r.book)!;
    const lastChapter = r.chapterEnd ?? r.chapter!;
    if (lastChapter > book.chapters.length) unresolved.push(`${r.label} (no such chapter)`);
    else if (r.verseStart !== undefined) {
      if (r.verseEnd! > book.chapters[r.chapter! - 1]) unresolved.push(`${r.label} (chapter has ${book.chapters[r.chapter! - 1]} verses)`);
      else if (!bsbText(r).trim()) unresolved.push(`${r.label} (the BSB leaves this verse empty)`);
    }
  }
}

// 6) LSB slots: one per cited verse or range. Text already filled in is kept.
const lsbPath = path.join(CONTENT, "lsb-verses.json");
type Lsb = { ref: string; key: string; text: string };
const old: Lsb[] = fs.existsSync(lsbPath) ? JSON.parse(fs.readFileSync(lsbPath, "utf8")) : [];
const fullName = (r: VerseRef) => r.label.replace(/^\S+(?: \S+)?(?= \d)/, BOOKS.find((x) => x.slug === r.book)!.name);
const lsbRefs = bibleRefs.filter((r) => r.verseStart !== undefined);
const chapterOnly = bibleRefs.filter((r) => r.verseStart === undefined);
const lsb: Lsb[] = lsbRefs.map((r) => ({
  ref: fullName(r),
  key: r.key,
  text: old.find((o) => o.key === r.key)?.text || "",
}));
fs.writeFileSync(lsbPath, JSON.stringify(lsb, null, 2));
const lsbEmpty = lsb.filter((x) => !x.text.trim());
const orphaned = old.filter((o) => o.text.trim() && !lsb.some((x) => x.key === o.key));
fs.writeFileSync(
  path.join(CONTENT, "lsb-todo.md"),
  `# LSB verses still to fill in (${lsbEmpty.length} of ${lsb.length})\n\n` +
    `Open \`content/lsb-verses.json\`, find the reference, and paste the LSB text between the quotes after "text".\n` +
    `Until a slot is filled, the app shows the BSB text with a small "BSB" label.\n\n` +
    lsbEmpty.map((x) => `- [ ] ${x.ref}`).join("\n") +
    "\n"
);

// 7) Small helper files for the app
//    guide-verses.json  BSB text for every cited verse (so chips work instantly, even offline)
//    verse-index.json   where each verse is used in the guide ("Used in the guide:")
//    search-items.json  the list the search bar looks through
const guideVerses: Record<string, { ref: string; bsb: [number, string][] }> = {};
if (bsbChecked) {
  for (const r of lsbRefs) {
    const book = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "bible", `${r.book}.json`), "utf8"));
    const verses: string[] = book.chapters[r.chapter! - 1];
    const bsb: [number, string][] = [];
    for (let v = r.verseStart!; v <= r.verseEnd!; v++) bsb.push([v, verses[v - 1]]);
    guideVerses[r.key] = { ref: fullName(r), bsb };
  }
}
fs.writeFileSync(path.join(CONTENT, "guide-verses.json"), JSON.stringify(guideVerses));

type Use = { href: string; title: string; label: string };
type SearchItem = { kind: string; label: string; title: string; text: string; href: string; verses: string[] };
const verseIndex: Record<string, { label: string; uses: Use[] }> = {};
const searchItems: SearchItem[] = [];
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*➕]/g, "").replace(/\s+/g, " ").trim();
const useVerses = (m: Meta | undefined, use: Use) => {
  if (!m) return;
  for (const v of m.verses) {
    if (v.kind !== "bible") continue;
    const entry = (verseIndex[v.key] ||= { label: v.label, uses: [] });
    if (!entry.uses.some((u) => u.href === use.href)) entry.uses.push(use);
  }
};
const item = (kind: string, label: string, t: string, text: string, href: string, m?: Meta) =>
  searchItems.push({ kind, label, title: plain(t), text: plain(text), href, verses: (m?.verses || []).map((v) => v.label) });

for (const g of groups) {
  const short = g.slug === "jw" ? "JW" : g.name;
  for (const p of g.offense) {
    const href = `/${g.slug}/case/${p.id}`;
    const use = { href, title: p.title, label: `${short} · play` };
    item("play", `${short} · play`, `${p.title}${p.subtitle ? ` (${p.subtitle})` : ""}`, `${p.opener?.text || ""} ${p.summary?.text || ""} ${p.lead?.text || ""}`, href, merge([p.opener, p.summary, p.lead, ...p.chain, ...p.questions].filter(Boolean) as Meta[]));
    p.ifTheySay.forEach((b, i) => item("branch", `${short} · if they say`, b.theySay, b.youSay, `${href}#say-${i + 1}`, b));
    for (const m of [p.summary, p.lead, p.opener, ...p.chain, ...p.questions, ...p.ifTheySay, p.closer, ...p.notes]) useVerses(m, use);
  }
  for (const o of g.defense) {
    const href = `/${g.slug}/objection/${o.id}`;
    item("objection", `${short} · objection`, o.objection, `${o.response} ${o.askBack || ""}`, href, o);
    useVerses(o, { href, title: plain(o.objection), label: `${short} · objection` });
  }
  g.cheatCard.forEach((c) => {
    item("card", `${short} · quick card`, c.text, "", `/${g.slug}/card`, c);
    useVerses(c, { href: `/${g.slug}/card`, title: `${g.name} quick card`, label: `${short} · quick card` });
  });
}
{
  const hs = holySpiritPlay;
  const use = { href: "/holy-spirit", title: "The Holy Spirit", label: "Holy Spirit" };
  hs.stepA.rows.forEach((r) => (item("holy-spirit", "Holy Spirit · the Spirit is a Person", r.goTo, `${r.point} ${r.question}`, "/holy-spirit", r), useVerses(r, use)));
  hs.stepB.rows.forEach((r) => (item("holy-spirit", "Holy Spirit · that Person is Yahweh", `${r.first}`, `${r.second} ${r.note}`, "/holy-spirit#b", r), useVerses(r, use)));
  hs.stepA.ifTheySay.forEach((b) => (item("branch", "Holy Spirit · if they say", b.theySay, b.youSay, "/holy-spirit", b), useVerses(b, use)));
  hs.stepB.ifTheySay.forEach((b) => (item("branch", "Holy Spirit · if they say", b.theySay, b.youSay, "/holy-spirit#b", b), useVerses(b, use)));
  [hs.stepA.opener, hs.stepB.structure, hs.stepB.otOnly, hs.stepB.closer].forEach((m) => useVerses(m, use));
  const mu = { href: "/method", title: "The Method", label: "Method" };
  method.moves.forEach((m) => (item("method", "Method", m.title, m.text, "/method", m), useVerses(m, mu)));
  method.universalTools.forEach((m) => (item("method", "Method · universal tool", m.title, m.text, "/method", m), useVerses(m, mu)));
}
fs.writeFileSync(path.join(CONTENT, "verse-index.json"), JSON.stringify(verseIndex));
fs.writeFileSync(path.join(CONTENT, "search-items.json"), JSON.stringify(searchItems));

// 8) tools/lsb-helper.html: a fill-in page for the LSB verses (open it in a browser)
{
  const template = fs.readFileSync(path.join(ROOT, "scripts", "lsb-helper-template.html"), "utf8");
  fs.mkdirSync(path.join(ROOT, "tools"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "tools", "lsb-helper.html"), template.replace("__DATA__", () => JSON.stringify(lsb).replace(/</g, "\\u003c")));
}

// ───────────────────────── report ─────────────────────────

const countPlus = (o: unknown): number =>
  Array.isArray(o)
    ? o.reduce((a: number, x) => a + countPlus(x), 0)
    : o && typeof o === "object"
      ? ((o as Meta).supplemental === true && !("chain" in (o as object)) ? 1 : 0) +
        Object.values(o as object).reduce((a: number, v) => a + countPlus(v), 0)
      : 0;
const countLinks = (g: Group) =>
  walkLinks(g) -
  g.offense.reduce(
    (b, p) =>
      b +
      [p.summary, p.lead, p.opener, ...p.chain, ...p.questions, ...p.ifTheySay, p.closer, ...p.notes]
        .filter(Boolean)
        .reduce((c, x) => c + (x as Meta).links.length, 0),
    0
  );

const out: string[] = [];
const say = (s = "") => out.push(s);
say(`# Parse report`);
say();
say(`Source: content/field_guide_apologetics.md (${lines.length} lines)`);
say();
say(`## Per group`);
say();
say(`| Group | Plays | Steps | Questions | "If they say" (plays) | Objections | Cheat card | Exits | ▶ links | ➕ items |`);
say(`|---|---|---|---|---|---|---|---|---|---|`);
for (const g of groups) {
  say(
    `| ${g.name} | ${g.offense.length} | ${g.offense.reduce((a, p) => a + p.chain.length, 0)} | ${g.offense.reduce((a, p) => a + p.questions.length, 0)} | ${g.offense.reduce((a, p) => a + p.ifTheySay.length, 0)} | ${g.defense.length} | ${g.cheatCard.length} | ${g.exits?.items.length ?? 0} | ${countLinks(g)} | ${countPlus(g)} |`
  );
}
say();
say(`## Shared sections`);
say();
say(`- The Method: ${method.moves.length} moves, ${method.universalTools.length} universal tools, ${walkLinks(method)} ▶ links`);
say(
  `- Holy Spirit Play: Step A ${holySpiritPlay.stepA.rows.length} rows + ${holySpiritPlay.stepA.ifTheySay.length} "if they say"; Step B ${holySpiritPlay.stepB.rows.length} rows (${holySpiritPlay.stepB.rows.filter((r) => r.kind === "pair").length} OT→NT pairs) + ${holySpiritPlay.stepB.ifTheySay.length} "if they say"; ${walkLinks(holySpiritPlay)} ▶ links; ${countPlus(holySpiritPlay)} ➕ items`
);
say(`- Video References: ${videos.length} videos`);
say();
say(`## Nothing-dropped checks`);
say();
say(`- Lines the parser could not place: **${unplaced.length}**`);
for (const l of unplaced) say(`  - line ${l.n + 1}: \`${l.s.slice(0, 100)}\``);
say(`- ▶ links: ${sourceLinks} in the markdown, ${jsonLinks} in guide.json ${sourceLinks === jsonLinks && sourceLinks === linkCount ? "✓" : "✗ MISMATCH"}`);
say(`- ➕ tags: ${sourcePlus} in the markdown, ${jsonPlus + titlePlus} in guide.json ${sourcePlus === jsonPlus + titlePlus && sourcePlus === plusCount ? "✓" : "✗ MISMATCH"}`);
say(`- Words in the markdown missing from guide.json: **${missingWords.length}**${missingWords.length ? " → " + missingWords.join(", ") : " ✓ (Quick Jump table excluded on purpose)"}`);
say(`- Video links pointing at a video not in the Video References table: ${unlistedVideos.length}${unlistedVideos.length ? " → " + unlistedVideos.join(", ") : " ✓"}`);
say(`- Videos in the table that no line links to: ${unusedVideos.length}${unusedVideos.length ? " → " + unusedVideos.map((v) => v.id).join(", ") : ""}`);
say();
say(`## Verses`);
say();
const kinds = (k: VerseRef["kind"]) => refs.filter((r) => r.kind === k);
say(`- Bible references: ${bibleRefs.length} unique (${lsbRefs.length} verses/ranges + ${chapterOnly.length} whole-chapter mentions)`);
say(`- Quran: ${kinds("quran").length} · Book of Mormon: ${kinds("bom").length} · D&C: ${kinds("dc").length} · JST: ${kinds("jst").length} · Hadith: ${kinds("hadith").length}`);
say(
  bsbChecked
    ? `- Resolve in the bundled BSB: ${bibleRefs.length - unresolved.length} of ${bibleRefs.length}${unresolved.length ? " ✗ → " + unresolved.join("; ") : " ✓"}`
    : `- BSB check skipped (run scripts/build-bible.ts first)`
);
say(`- LSB slots: ${lsb.length} total, **${lsbEmpty.length} still empty**${orphaned.length ? ` (${orphaned.length} filled slot(s) no longer cited: ${orphaned.map((o) => o.ref).join(", ")})` : ""}`);
say(`- Whole-chapter mentions (no LSB slot; they open the chapter in the reader): ${chapterOnly.map((r) => r.label).join(", ")}`);
if (bare.length) {
  say(`- Chapter:verse numbers written without a book name (not turned into chips):`);
  for (const b of bare) say(`  - ${b.where}: "${b.found}"`);
}
say();
say(`## For Charlie to look at`);
say();
for (const f of flags) say(`- ${f}`);
const noOpener = groups.flatMap((g) => g.offense.filter((p) => !p.opener).map((p) => `${g.name} ${p.number}`));
say(`- Plays with no line marked "Opener" (the play screen will start at the steps): ${noOpener.join(", ")}`);
const noAskBack = groups.flatMap((g) => g.defense.filter((o) => !o.askBack).map((o) => `${g.name}: ${o.objection.slice(0, 40)}`));
say(`- Objections whose "Ask back" cell holds only a ▶ link (no question to show): ${noAskBack.join(" | ")}`);
say();

if (fs.existsSync(path.join(CONTENT, "bible-report.json"))) {
  const b = JSON.parse(fs.readFileSync(path.join(CONTENT, "bible-report.json"), "utf8"));
  const kb = (n: number) => `${Math.round(n / 1024).toLocaleString()} KB`;
  say(`## Bible bundle (BSB)`);
  say();
  say(`- ${b.verses.toLocaleString()} verses, 66 book files: ${kb(b.bookFiles.raw)} (${kb(b.bookFiles.gz)} compressed); biggest is ${b.bookFiles.biggest.file} at ${kb(b.bookFiles.biggest.raw)}`);
  say(`- Search files (4 chunks): ${kb(b.searchTotal.raw)} (${kb(b.searchTotal.gz)} compressed)`);
  say(`- ${b.omittedVerses} verse numbers are empty in the BSB (verses it leaves out, e.g. Matt 17:21)`);
  say();
}

const report = out.join("\n");
fs.writeFileSync(path.join(CONTENT, "parse-report.md"), report);
console.log(report);
