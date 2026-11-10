// The 66 books of the Bible, in order, with the names and abbreviations people type.
// Used by the guide parser (to find verse references in the markdown)
// and by the app (to understand what someone types in the search bar).

export type Book = {
  slug: string; // file name: /public/bible/<slug>.json
  name: string; // full name shown in the reader
  short: string; // short name used on verse chips ("Isa", "1 Cor")
  aliases: string[]; // other spellings people use (lowercase, no dots)
};

const b = (slug: string, name: string, short: string, ...aliases: string[]): Book => ({
  slug,
  name,
  short,
  aliases,
});

export const BOOKS: Book[] = [
  b("genesis", "Genesis", "Gen", "ge", "gn"),
  b("exodus", "Exodus", "Ex", "exo", "exod"),
  b("leviticus", "Leviticus", "Lev", "le", "lv"),
  b("numbers", "Numbers", "Num", "nu", "nm", "nb"),
  b("deuteronomy", "Deuteronomy", "Deut", "dt", "de", "deu"),
  b("joshua", "Joshua", "Josh", "jos", "jsh"),
  b("judges", "Judges", "Judg", "jdg", "jg", "jdgs"),
  b("ruth", "Ruth", "Ruth", "rth", "ru"),
  b("1-samuel", "1 Samuel", "1 Sam", "1 sa", "1 sm"),
  b("2-samuel", "2 Samuel", "2 Sam", "2 sa", "2 sm"),
  b("1-kings", "1 Kings", "1 Kgs", "1 ki", "1 kin", "1 king"),
  b("2-kings", "2 Kings", "2 Kgs", "2 ki", "2 kin", "2 king"),
  b("1-chronicles", "1 Chronicles", "1 Chr", "1 ch", "1 chron"),
  b("2-chronicles", "2 Chronicles", "2 Chr", "2 ch", "2 chron"),
  b("ezra", "Ezra", "Ezra", "ezr"),
  b("nehemiah", "Nehemiah", "Neh", "ne"),
  b("esther", "Esther", "Esth", "est", "es"),
  b("job", "Job", "Job", "jb"),
  b("psalms", "Psalms", "Ps", "psalm", "psa", "pss", "psm"),
  b("proverbs", "Proverbs", "Prov", "pr", "pro", "prv"),
  b("ecclesiastes", "Ecclesiastes", "Eccl", "ecc", "ec", "eccles", "qoh"),
  b("song-of-solomon", "Song of Solomon", "Song", "song of songs", "sos", "so", "canticles", "cant"),
  b("isaiah", "Isaiah", "Isa", "is"),
  b("jeremiah", "Jeremiah", "Jer", "je", "jr"),
  b("lamentations", "Lamentations", "Lam", "la"),
  b("ezekiel", "Ezekiel", "Ezek", "eze", "ezk"),
  b("daniel", "Daniel", "Dan", "da", "dn"),
  b("hosea", "Hosea", "Hos", "ho"),
  b("joel", "Joel", "Joel", "jl"),
  b("amos", "Amos", "Amos", "am"),
  b("obadiah", "Obadiah", "Obad", "ob", "oba"),
  b("jonah", "Jonah", "Jonah", "jon", "jnh"),
  b("micah", "Micah", "Mic", "mc"),
  b("nahum", "Nahum", "Nah", "na"),
  b("habakkuk", "Habakkuk", "Hab", "hb"),
  b("zephaniah", "Zephaniah", "Zeph", "zep", "zp"),
  b("haggai", "Haggai", "Hag", "hg"),
  b("zechariah", "Zechariah", "Zech", "zec", "zc"),
  b("malachi", "Malachi", "Mal", "ml"),
  b("matthew", "Matthew", "Matt", "mt", "mat"),
  b("mark", "Mark", "Mark", "mk", "mrk", "mr"),
  b("luke", "Luke", "Luke", "lk", "luk"),
  b("john", "John", "John", "jn", "jhn", "joh"),
  b("acts", "Acts", "Acts", "ac", "act"),
  b("romans", "Romans", "Rom", "ro", "rm"),
  b("1-corinthians", "1 Corinthians", "1 Cor", "1 co"),
  b("2-corinthians", "2 Corinthians", "2 Cor", "2 co"),
  b("galatians", "Galatians", "Gal", "ga"),
  b("ephesians", "Ephesians", "Eph", "ephes"),
  b("philippians", "Philippians", "Phil", "php", "pp"),
  b("colossians", "Colossians", "Col", "co"),
  b("1-thessalonians", "1 Thessalonians", "1 Thess", "1 th", "1 thes"),
  b("2-thessalonians", "2 Thessalonians", "2 Thess", "2 th", "2 thes"),
  b("1-timothy", "1 Timothy", "1 Tim", "1 ti"),
  b("2-timothy", "2 Timothy", "2 Tim", "2 ti"),
  b("titus", "Titus", "Titus", "tit", "ti"),
  b("philemon", "Philemon", "Phlm", "phm", "philem"),
  b("hebrews", "Hebrews", "Heb", "he"),
  b("james", "James", "Jas", "jm", "jam"),
  b("1-peter", "1 Peter", "1 Pet", "1 pe", "1 pt"),
  b("2-peter", "2 Peter", "2 Pet", "2 pe", "2 pt"),
  b("1-john", "1 John", "1 John", "1 jn", "1 jhn", "1 jo"),
  b("2-john", "2 John", "2 John", "2 jn", "2 jhn", "2 jo"),
  b("3-john", "3 John", "3 John", "3 jn", "3 jhn", "3 jo"),
  b("jude", "Jude", "Jude", "jud", "jd"),
  b("revelation", "Revelation", "Rev", "re", "rv", "revelations", "apocalypse"),
];

export const OLD_TESTAMENT_COUNT = 39;
export const SINGLE_CHAPTER_BOOKS = new Set(["obadiah", "philemon", "2-john", "3-john", "jude"]);

export function isOldTestament(slug: string): boolean {
  const i = BOOKS.findIndex((x) => x.slug === slug);
  return i >= 0 && i < OLD_TESTAMENT_COUNT;
}

// Every lowercase spelling -> book. "1 cor", "first corinthians", "i corinthians", "1cor" all work.
const LOOKUP = new Map<string, Book>();
const ORDINALS: Record<string, string[]> = {
  "1": ["1", "i", "first", "1st"],
  "2": ["2", "ii", "second", "2nd"],
  "3": ["3", "iii", "third", "3rd"],
};
// Plain names first ("isa" must mean Isaiah), then the numbered books ("1 sam", "i sam", "first samuel", "1sam").
for (const numbered of [false, true]) {
  for (const book of BOOKS) {
    const names = [book.name, book.short, ...book.aliases].map((n) => n.toLowerCase());
    for (const n of names) {
      const m = n.match(/^([123]) (.+)$/);
      if (!!m !== numbered) continue;
      if (!m) {
        if (!LOOKUP.has(n)) LOOKUP.set(n, book);
        continue;
      }
      for (const ord of ORDINALS[m[1]]) {
        if (!LOOKUP.has(`${ord} ${m[2]}`)) LOOKUP.set(`${ord} ${m[2]}`, book);
        if (!LOOKUP.has(`${ord}${m[2]}`)) LOOKUP.set(`${ord}${m[2]}`, book);
      }
    }
  }
}

/** Find a book from whatever someone typed ("jn", "1cor", "First Corinthians", "Ps."). */
export function findBook(typed: string): Book | undefined {
  const key = typed.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return LOOKUP.get(key);
}

/** All spellings, longest first (for building search patterns). */
export function allBookSpellings(): string[] {
  return [...LOOKUP.keys()].sort((a, c) => c.length - a.length);
}
