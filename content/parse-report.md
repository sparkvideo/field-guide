# Parse report

Source: content/field_guide_apologetics.md (615 lines)

## Per group

| Group | Plays | Steps | Questions | "If they say" (plays) | Objections | Cheat card | Exits | ▶ links | ➕ items |
|---|---|---|---|---|---|---|---|---|---|
| Jehovah's Witness | 6 | 24 | 1 | 9 | 22 | 6 | 3 | 28 | 0 |
| Unitarian | 5 | 14 | 1 | 4 | 20 | 6 | 3 | 22 | 0 |
| Mormon | 4 | 18 | 3 | 8 | 17 | 6 | 3 | 20 | 0 |
| Muslim | 6 | 18 | 0 | 7 | 21 | 6 | 3 | 32 | 0 |
| Atheist | 4 | 10 | 0 | 1 | 21 | 6 | 0 | 15 | 0 |

## Shared sections

- The Method: 10 moves, 5 universal tools, 12 ▶ links
- Holy Spirit Play: Step A 6 rows + 5 "if they say"; Step B 7 rows (5 OT→NT pairs) + 3 "if they say"; 20 ▶ links; 0 ➕ items
- Video References: 38 videos
- Extra pages (content/extras.md): The Gospel (9 sections), The Way of the Master (8 sections), Worldviews: how do you know? (8 sections), The Trinity (6 sections), Is the Bible reliable? (6 sections), Words they use (6 sections); 0 ➕ items

## Nothing-dropped checks

- Lines the parser could not place: **0**
- ▶ links: 149 in the markdown, 149 in guide.json ✓
- ➕ tags: 1 in the markdown, 1 in guide.json ✓
- Words in the markdown missing from guide.json: **0** ✓ (Quick Jump table excluded on purpose)
- Video links pointing at a video not in the Video References table: 0 ✓
- Videos in the table that no line links to: 0

## Verses

- Bible references: 415 unique (392 verses/ranges + 23 whole-chapter mentions)
- Quran: 26 · Book of Mormon: 6 · D&C: 1 · JST: 1 · Hadith: 5
- Resolve in the bundled BSB: 415 of 415 ✓
- LSB slots: 392 total, **18 still empty**
- Whole-chapter mentions (no LSB slot; they open the chapter in the reader): Num 21, Deut 34, Ps 8, Ps 22, Ps 49, Ps 82, Ps 95, Ps 102, Prov 8, Isa 42, Isa 43–45, Isa 53, Isa 61, Ezek 37, Dan 7, Mark 15, John 1, John 14, Acts 2, Acts 3, 1 Cor 8, Phil 2, Heb 2
- Chapter:verse numbers written without a book name (not turned into chips):
  - Muslim objection 18: "5:16"

## For Charlie to look at

- Holy Spirit Play Step B, row 6 ("Acts 5:3–4: "lie to the Holy Spirit" = "…") is not an Old Testament → New Testament pair, so the app will show it as a single passage instead of stacking "Old Testament / New Testament".
- Holy Spirit Play Step B, row 7 ("Rom 8:9; 1 Pet 1:10–11…") is not an Old Testament → New Testament pair, so the app will show it as a single passage instead of stacking "Old Testament / New Testament".
- Plays with no line marked "Opener" (the play screen will start at the steps): 
- Objections whose "Ask back" cell holds only a ▶ link (no question to show): 

## Bible bundle (BSB)

- 31,102 verses, 66 book files: 3,858 KB (1,247 KB compressed); biggest is psalms.json at 213 KB
- Search files (4 chunks): 4,098 KB (1,288 KB compressed)
- 16 verse numbers are empty in the BSB (verses it leaves out, e.g. Matt 17:21)
