import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { guide } from "@/lib/guide";

export const metadata = { title: "The Method · Apologetics Field Guide" };

export default function MethodPage() {
  const m = guide.method;
  return (
    <>
      <TopBar back="/" share={{ title: "The Method" }} />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">
          The Method
        </h1>
        <p className="muted mt-2">
          <Md text={m.intro.text} />
        </p>

        <ol className="steps mt-8">
          {m.moves.map((move) => (
            <li key={move.number}>
              <strong>
                <Md text={move.title} />
              </strong>
              {move.text && (
                <p className="mt-1">
                  <Md text={move.text} />
                </p>
              )}
              <VerseChips verses={move.verses} context={move.text} />
            </li>
          ))}
        </ol>

        <section className="section">
          <h2 className="label">Universal tools</h2>
          {m.universalTools.map((t, i) => (
            <div key={i} className="mb-6">
              <strong>
                <Md text={t.title} />
              </strong>
              <p className="mt-1">
                <Md text={t.text} />
              </p>
              <VerseChips verses={t.verses} context={t.text} />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
