import Link from "next/link";
import { notFound } from "next/navigation";
import { Branches } from "@/components/Bits";
import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { getGroup, guide, shortName } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.groups.flatMap((g) => g.offense.map((p) => ({ group: g.slug, play: p.id })));
}
export async function generateMetadata({ params }: { params: Promise<{ group: string; play: string }> }) {
  const { group, play } = await params;
  const p = getGroup(group)?.offense.find((x) => x.id === play);
  return { title: p ? `${p.title} · Field Guide` : "Field Guide" };
}

export default async function PlayPage({ params }: { params: Promise<{ group: string; play: string }> }) {
  const { group, play } = await params;
  const g = getGroup(group);
  const p = g?.offense.find((x) => x.id === play);
  if (!g || !p) notFound();
  const href = `/${g.slug}/case/${p.id}`;

  // No line marked "Opener"? Then the first step is where you start, shown large.
  const startHere = !p.opener && !p.lead && p.chain.length > 0 ? p.chain[0] : undefined;
  const steps = startHere ? p.chain.slice(1) : p.chain;
  let phase: string | undefined = startHere?.phase;
  return (
    <>
      <TopBar back={`/${g.slug}`} pin={{ href, title: p.title, label: `${shortName(g)} · play` }} share={{ title: p.title }} />
      <main className="page">
        <p className="label" style={{ borderLeft: `3px solid ${g.color}`, paddingLeft: 8 }}>
          {g.name} · Make the case
        </p>
        <h1 className="text-[26px] font-bold leading-tight">
          {p.title.includes("*") ? <Md text={p.title} /> : p.title}
        </h1>
        {p.subtitle && (
          <p className="muted mt-1">
            <Md text={p.subtitle} />
          </p>
        )}

        {p.notes
          .filter((n) => n.kind === "warning")
          .map((n, i) => (
            <p key={i} className="rows mt-5 p-4 small">
              <Md text={n.text} />
            </p>
          ))}

        {p.summary && (
          <details className="plain mt-4">
            <summary>The logic</summary>
            <p>
              <Md text={p.summary.text} />
            </p>
          </details>
        )}

        {p.lead && (
          <section className="section">
            <p className="text-[20px]">
              <Md text={p.lead.text} />
            </p>
            <VerseChips verses={p.lead.verses} context={p.lead.text} />
            <p className="mt-4">
              <Link className="btn primary" href="/holy-spirit">
                Open the Holy Spirit play
              </Link>
            </p>
          </section>
        )}

        {p.opener && (
          <section className="section">
            <h2 className="label">Say this</h2>
            <p className="big">
              <Md text={p.opener.text} />
            </p>
            <VerseChips verses={p.opener.verses} context={p.opener.text} />
          </section>
        )}

        {startHere && (
          <section className="section">
            <h2 className="label">Start here</h2>
            {startHere.phase && <strong className="mb-1 block">{startHere.phase}</strong>}
            <p className={startHere.text.length < 170 ? "big" : "text-[20px]"}>
              {startHere.label && <strong>{startHere.label}: </strong>}
              <Md text={startHere.text} />
            </p>
            <VerseChips verses={startHere.verses} context={startHere.text} />
          </section>
        )}

        {steps.length > 0 && (
          <section className="section">
            <h2 className="label">Walk through</h2>
            <ol className="steps mt-3" style={startHere ? { counterReset: "step 1" } : undefined}>
              {steps.map((s, i) => {
                const header = s.phase && s.phase !== phase ? s.phase : undefined;
                phase = s.phase;
                return (
                  <li key={i}>
                    {header && <strong className="mb-1 block">{header}</strong>}
                    {s.label && <strong>{s.label}: </strong>}
                    <Md text={s.text} />
                    <VerseChips verses={s.verses} context={s.text} />
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {p.questions.length > 0 && (
          <section className="section">
            <h2 className="label">Ask them</h2>
            {p.questions.map((q, i) => (
              <div key={i} className="mb-4">
                <p className="ask">
                  <Md text={q.text} />
                </p>
                <VerseChips verses={q.verses} context={q.text} />
              </div>
            ))}
          </section>
        )}

        {p.ifTheySay.length > 0 && (
          <section className="section">
            <h2 className="label">If they say…</h2>
            <Branches branches={p.ifTheySay} />
          </section>
        )}

        {p.closer && (
          <section className="section">
            <h2 className="label">Close with</h2>
            <p className="big">
              <Md text={p.closer.text} />
            </p>
            <VerseChips verses={p.closer.verses} context={p.closer.text} />
          </section>
        )}

        {p.notes
          .filter((n) => n.kind === "quote")
          .map((n, i) => (
            <blockquote key={i} className="muted mt-8 border-l-2 border-line pl-4">
              <Md text={n.text} />
            </blockquote>
          ))}

      </main>
    </>
  );
}
