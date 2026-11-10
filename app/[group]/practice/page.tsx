import { notFound } from "next/navigation";
import { Practice } from "@/components/Practice";
import { Quiz } from "@/components/Quiz";
import { Toggle } from "@/components/Toggle";
import { TopBar } from "@/components/TopBar";
import { getGroup, guide } from "@/lib/guide";
import { cardsFor } from "@/lib/practice";

export const dynamicParams = false;
export function generateStaticParams() {
  return guide.groups.map((g) => ({ group: g.slug }));
}

export default async function PracticePage({ params }: { params: Promise<{ group: string }> }) {
  const g = getGroup((await params).group);
  if (!g) notFound();
  const cards = cardsFor(g);
  return (
    <>
      <TopBar back="history" />
      <main className="page">
        <h1 className="text-[26px] font-bold leading-tight">Drill: {g.name}</h1>
        <div className="mt-3">
          <Toggle id={`drill-${g.slug}`} labels={["Flip cards", "Quiz"]} panels={[<Practice key="flip" cards={cards} />, <Quiz key="quiz" cards={cards} />]} />
        </div>
      </main>
    </>
  );
}
