import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowBar } from "@/components/FlowBar";
import { Md } from "@/components/Md";
import { ShareCard } from "@/components/ShareCard";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { getGroup, guide, shortName } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.groups.flatMap((g) => g.defense.map((o) => ({ group: g.slug, id: o.id })));
}
export async function generateMetadata({ params }: { params: Promise<{ group: string; id: string }> }) {
  const { group, id } = await params;
  const o = getGroup(group)?.defense.find((x) => x.id === id);
  return { title: o ? `${o.objection.replace(/[*"]/g, "")} · Field Guide` : "Field Guide" };
}

export default async function ObjectionPage({ params }: { params: Promise<{ group: string; id: string }> }) {
  const { group, id } = await params;
  const g = getGroup(group);
  const o = g?.defense.find((x) => x.id === id);
  if (!g || !o) notFound();
  const href = `/${g.slug}/objection/${o.id}`;
  const at = g.defense.indexOf(o);
  const step = (x: (typeof g.defense)[number] | undefined) => (x ? { href: `/${g.slug}/objection/${x.id}`, title: x.objection.replace(/\*/g, "") } : undefined);
  const plainTitle = o.objection.replace(/\*/g, "");

  return (
    <>
      <TopBar back={`/${g.slug}#objections`} pin={{ href, title: plainTitle, label: `${shortName(g)} · objection` }} share={{ title: plainTitle }} />
      <main className="page with-flowbar">
        <p className="label" style={{ borderLeft: `3px solid ${g.color}`, paddingLeft: 8 }}>
          {g.name}: they say
        </p>
        <h1 className="text-[24px] font-bold leading-snug">
          <Md text={o.objection} />
        </h1>

        <section className="section">
          <h2 className="label">You say</h2>
          <p className={o.response.length < 150 ? "big" : "serif text-[21px] leading-[1.5]"}>
            <Md text={o.response} />
          </p>
          {o.crossRef && (
            <p className="mt-4">
              <Link className="btn primary" href="/holy-spirit">
                Open the Holy Spirit play
              </Link>
            </p>
          )}
        </section>

        {o.goTo && (
          <section className="section">
            <h2 className="label">Verses</h2>
            <VerseChips verses={o.verses} context={o.goTo} />
            {/[a-z]{4,}/.test(o.goTo.replace(/\*\*[^*]+\*\*/g, "")) && (
              <p className="muted small mt-3">
                <Md text={o.goTo} />
              </p>
            )}
          </section>
        )}

        {o.askBack && (
          <section className="section">
            <h2 className="label">Ask them back</h2>
            <p className="ask">
              <Md text={o.askBack} />
            </p>
          </section>
        )}

        <p className="mt-2">
          <ShareCard group={g.name} theySay={o.objection} youSay={o.response} verses={o.verses.map((v) => v.label)} askBack={o.askBack} />
        </p>
        <p className="mt-6">
          <Link className="btn" href={`/${g.slug}#first`}>
            Now go on offense: make the case
          </Link>
        </p>
      </main>
      <FlowBar prev={step(g.defense[at - 1])} next={step(g.defense[at + 1])} position={`${at + 1} of ${g.defense.length}`} listHref={`/${g.slug}#objections`} />
    </>
  );
}
