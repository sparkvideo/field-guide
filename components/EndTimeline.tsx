// The order of events, drawn as a single line to read down.
const STEPS = [
  { name: "The church age", line: "Now. The gospel goes to every nation.", ref: "Matt 28:19–20", now: true },
  { name: "The rapture", line: "Christ calls His church to Himself. Any moment.", ref: "1 Thess 4:16–17" },
  { name: "The tribulation", line: "Seven years. Daniel's seventieth week.", ref: "Dan 9:27" },
  { name: "The second coming", line: "Christ returns to the earth in glory.", ref: "Rev 19:11–16" },
  { name: "The kingdom", line: "He reigns a thousand years from Jerusalem.", ref: "Rev 20:4–6" },
  { name: "The final judgment", line: "The dead are raised and judged.", ref: "Rev 20:11–15" },
  { name: "All things new", line: "A new heaven and a new earth, forever.", ref: "Rev 21:1–5" },
];

export default function EndTimeline() {
  return (
    <section className="tl" aria-label="The order of events">
      <h2 className="tl-title serif">The order of events</h2>
      <ol className="tl-list">
        {STEPS.map((s) => (
          <li key={s.name} className={s.now ? "now" : undefined}>
            <span className="tl-dot" aria-hidden="true" />
            <span className="tl-name">{s.name}</span>
            {s.now && <span className="tl-here">You are here</span>}
            <span className="tl-line">{s.line}</span>
            <span className="tl-ref">{s.ref}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
