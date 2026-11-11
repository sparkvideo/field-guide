import EndTimeline from "@/components/EndTimeline";
import ActsPrayer from "@/components/ActsPrayer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { guide } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.topics.map((t) => ({ slug: t.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = guide.topics.find((x) => x.slug === slug);
  return { title: t ? `${t.title} · Apologetics Field Guide` : "Apologetics Field Guide" };
}

// "(John 3:16; Rom 5:8)" at the end of a line is shown as chips instead of text.
const withoutRefs = (text: string) => text.replace(/\s*\((?:[1-3] )?[A-Z][a-z]+ \d[^()]*\)\s*$/, "").trim();

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = guide.topics.find((x) => x.slug === slug);
  if (!t) notFound();
  const href = `/topic/${t.slug}`;
  return (
    <>
      <TopBar back="/" pin={{ href, title: t.title, label: "For any conversation" }} share={{ title: t.title }} />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">{t.title}</h1>
        {t.subtitle && <p className="muted mt-1">{t.subtitle}</p>}
        {t.intro.map((l, i) => (
          <div key={i} className="mt-4">
            <p>
              <Md text={withoutRefs(l.text)} />
            </p>
            <VerseChips verses={l.verses} context={l.text} />
          </div>
        ))}

        {t.slug === "how-to-pray" && <ActsPrayer />}
        {t.slug === "the-end-times" && <EndTimeline />}

        {t.sections.map((sec, n) => {
          const glossary = sec.lines.every((l) => l.label && l.label !== "Ask");
          return (
            <section key={n} className="section">
              <h2 className="serif text-[22px] font-bold leading-snug">{sec.heading}</h2>
              {glossary ? (
                <dl className="mt-2">
                  {sec.lines.map((l, i) => (
                    <div key={i} className="border-t border-line py-3 first:border-t-0">
                      <dt className="font-semibold">{l.label}</dt>
                      <dd className="muted">
                        <Md text={withoutRefs(l.text)} />
                        <VerseChips verses={l.verses} context={l.text} />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                sec.lines.map((l, i) => {
                  const body = withoutRefs(l.text);
                  return l.label === "Ask" ? (
                    <p key={i} className="ask mt-4">
                      <Md text={l.text} />
                    </p>
                  ) : (
                    <div key={i} className="mt-2">
                      {body && body !== "➕" && (
                        <p>
                          {l.label && <strong>{l.label}: </strong>}
                          <Md text={body} />
                        </p>
                      )}
                      <VerseChips verses={l.verses} context={l.text} />
                    </div>
                  );
                })
              )}
            </section>
          );
        })}

        {t.slug === "the-gospel" && (
          <p className="mt-10">
            <Link className="btn primary" href="/topic/the-way-of-the-master">
              Walk someone through it: The Way of the Master
            </Link>
          </p>
        )}
        {t.slug !== "the-gospel" && (
          <p className="mt-10">
            <Link className="btn primary" href="/topic/the-gospel">
              End with the gospel
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
