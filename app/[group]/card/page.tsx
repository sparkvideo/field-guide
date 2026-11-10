import Link from "next/link";
import { notFound } from "next/navigation";
import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { VerseChips } from "@/components/VerseSheet";
import { getGroup, guide } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.groups.map((g) => ({ group: g.slug }));
}

export default async function CardPage({ params }: { params: Promise<{ group: string }> }) {
  const g = getGroup((await params).group);
  if (!g) notFound();
  return (
    <>
      <TopBar back={`/${g.slug}`} share={{ title: `${g.name}: quick card` }} />
      <main className="page">
        <p className="label">📇 Quick card</p>
        <h1 className="text-[26px] font-bold leading-tight">{g.name}</h1>
        <ol className="steps mt-6">
          {g.cheatCard.map((c, i) => (
            <li key={i}>
              <Md text={c.text} />
              <VerseChips verses={c.verses} context={c.text} />
            </li>
          ))}
        </ol>
        <p className="mt-4">
          <Link className="btn" href={`/${g.slug}/practice`}>
            Drill: they say, you say
          </Link>
        </p>
      </main>
    </>
  );
}
