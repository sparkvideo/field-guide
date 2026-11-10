import { Branches } from "@/components/Bits";
import { Md } from "@/components/Md";
import { Toggle } from "@/components/Toggle";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { guide } from "@/lib/guide";

export const metadata = { title: "The Holy Spirit · Field Guide" };

export default function HolySpiritPage() {
  const hs = guide.holySpiritPlay;
  const a = hs.stepA;
  const b = hs.stepB;

  const stepA = (
    <>
      <h2 className="label">Say this</h2>
      <p className="big">
        <Md text={a.opener.text} />
      </p>

      <section className="section">
        <h2 className="label">Walk through</h2>
        {a.rows.map((r, i) => (
          <div key={i} className="rows mb-4 p-4">
            <VerseChips verses={r.verses} context={r.point} />
            <p className="mt-3">
              <Md text={r.point} />
            </p>
            <p className="ask mt-3">
              <Md text={r.question} />
            </p>
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="label">If they say…</h2>
        <Branches branches={a.ifTheySay} />
      </section>
    </>
  );

  const stepB = (
    <>
      <p>
        <Md text={b.structure.text} />
      </p>

      <section className="section" style={{ marginTop: 20 }}>
        {b.rows.map((r, i) => (
          <div key={i} className="rows mb-4 p-4">
            {r.kind === "pair" ? (
              <>
                <p>
                  <strong>Old Testament: </strong>
                  <Md text={r.first} />
                </p>
                <VerseChips verses={r.firstVerses} context={r.first} />
                <p className="mt-4">
                  <strong>New Testament: </strong>
                  <Md text={r.second} />
                </p>
                <VerseChips verses={r.secondVerses} context={r.second} />
              </>
            ) : (
              <>
                <p>
                  <Md text={r.first} />
                </p>
                {r.second && (
                  <p className="mt-3">
                    <Md text={r.second} />
                  </p>
                )}
              </>
            )}
            {r.kind === "single" && <VerseChips verses={r.verses} context={`${r.first} ${r.second}`} />}
            {r.kind === "pair" && <VerseChips verses={r.verses.filter((v) => ![...r.firstVerses, ...r.secondVerses].some((x) => x.key === v.key))} context={r.note} />}
            {r.note && (
              <p className="ask mt-4" style={{ fontSize: 19 }}>
                <Md text={r.note} />
              </p>
            )}
          </div>
        ))}
      </section>

      <details className="plain mt-2">
        <summary>{b.otOnly.label}</summary>
        <p>
          <Md text={b.otOnly.text} />
        </p>
        <VerseChips verses={b.otOnly.verses} context={b.otOnly.text} />
      </details>

      <section className="section">
        <h2 className="label">If they say…</h2>
        <Branches branches={b.ifTheySay} />
      </section>

      <section className="section">
        <h2 className="label">Close with</h2>
        <p className="big">
          <Md text={b.closer.text} />
        </p>
      </section>
    </>
  );

  return (
    <>
      <TopBar back="/" pin={{ href: "/holy-spirit", title: "The Holy Spirit", label: "Holy Spirit" }} share={{ title: "The Holy Spirit" }} />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">
          <span aria-hidden="true">🔥 </span>The Holy Spirit
        </h1>
        <details className="mt-2">
          <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
            <span className="muted line-clamp-2 [details[open]_&]:line-clamp-none">
              <Md text={hs.intro.text} />
            </span>
            <span className="link small [details[open]_&]:hidden">More</span>
          </summary>
        </details>
        <div className="mt-6">
          <Toggle id="hs" labels={["A: He is a Person", "B: He is Yahweh"]} panels={[stepA, stepB]} hashForSecond="#b" />
        </div>
      </main>
    </>
  );
}
