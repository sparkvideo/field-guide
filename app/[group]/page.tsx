import Link from "next/link";
import { notFound } from "next/navigation";
import { Chevron } from "@/components/Bits";
import { CardIcon } from "@/components/Icons";
import { Md } from "@/components/Md";
import { ObjectionList } from "@/components/ObjectionList";
import { Toggle } from "@/components/Toggle";
import { TopBar } from "@/components/TopBar";
import { getGroup, guide } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.groups.map((g) => ({ group: g.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ group: string }> }) {
  const g = getGroup((await params).group);
  return { title: g ? `${g.name} · Field Guide` : "Field Guide" };
}

export default async function GroupPage({ params }: { params: Promise<{ group: string }> }) {
  const g = getGroup((await params).group);
  if (!g) notFound();
  const about = g.beliefs ?? g.lead.find((l) => l.label && l.label !== "Note");
  const more = g.lead.filter((l) => l !== about && !l.text.includes("▶")); // skip the note that only explains video links

  const plays = (
    <div className="rows">
      {g.offense.map((p) => (
        <Link key={p.id} href={`/${g.slug}/case/${p.id}`} className="row">
          <span>
            <span className="block font-semibold">
              
              <Md text={p.title} />
            </span>
            {p.subtitle && (
              <span className="sub">
                <Md text={p.subtitle} />
              </span>
            )}
          </span>
          <Chevron />
        </Link>
      ))}
    </div>
  );

  const objections = (
    <>
      <ObjectionList slug={g.slug} items={g.defense.map((o) => ({ id: o.id, text: o.objection }))} />
      {g.exits && (
        <details className="plain mt-6">
          <summary>
            <Md text={g.exits.label} />
          </summary>
          <ul className="mt-1 list-disc pl-5">
            {g.exits.items.map((x, i) => (
              <li key={i} className="mb-3">
                <Md text={x.text} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );

  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-3 text-[28px] font-bold leading-tight">
            <span className="bar" style={{ background: g.color, minHeight: 30 }} aria-hidden="true" />
            {g.name}
          </h1>
          <Link href={`/${g.slug}/card`} className="link small inline-flex min-h-[48px] items-center gap-2 whitespace-nowrap">
            <CardIcon /> Quick card
          </Link>
        </div>

        {about && (
          <details className="mt-2">
            <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
              <span className="muted line-clamp-2 [details[open]_&]:line-clamp-none">
                <Md text={about.text} />
              </span>
              <span className="link small [details[open]_&]:hidden">More</span>
            </summary>
            {more.map((l, i) => (
              <p key={i} className="mt-3">
                {l.label && <strong>{l.label}: </strong>}
                <Md text={l.text} />
              </p>
            ))}
          </details>
        )}

        <div className="mt-6">
          <Toggle id={g.slug} labels={["Make the case", "Answer an objection"]} panels={[plays, objections]} hashForSecond="#objections" />
        </div>
      </main>
    </>
  );
}
