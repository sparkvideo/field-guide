import Link from "next/link";
import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { guide } from "@/lib/guide";

export const metadata = { title: "When it goes sideways · Apologetics Field Guide" };

// Gathers the "Typical exits" from every group, plus the Method's last move, on one screen.
export default function SidewaysPage() {
  const stayWarm = guide.method.moves[guide.method.moves.length - 1];
  return (
    <>
      <TopBar back="/" share={{ title: "When it goes sideways" }} />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">When it goes sideways</h1>
        <p className="muted mt-1">How they tend to leave the conversation, and what to do.</p>

        <section className="section" style={{ marginTop: 24 }}>
          <h2 className="label">
            <Md text={stayWarm.title} />
          </h2>
          <p className="big">
            <Md text={stayWarm.text} />
          </p>
        </section>

        {guide.groups
          .filter((g) => g.exits && !g.hidden)
          .map((g) => (
            <section key={g.slug} className="section">
              <h2 className="serif flex items-center gap-3 text-[22px] font-bold">
                <span className="bar" style={{ background: g.color, minHeight: 24 }} aria-hidden="true" />
                {g.name}
              </h2>
              <ul className="mt-2 list-disc pl-5">
                {g.exits!.items.map((x, i) => (
                  <li key={i} className="mb-3">
                    <Md text={x.text} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

        <p className="mt-10">
          <Link className="btn primary" href="/topic/the-gospel">
            End with the gospel
          </Link>
        </p>
      </main>
    </>
  );
}
