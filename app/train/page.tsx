import { TopBar } from "@/components/TopBar";
import { Train } from "@/components/Train";
import { guide } from "@/lib/guide";
import { allCards, cardsFor } from "@/lib/practice";

export const metadata = { title: "Train · Field Guide" };

export default function TrainPage() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">
          Train
        </h1>
        <Train cards={allCards()} groups={guide.groups.map((g) => ({ slug: g.slug, name: g.name, color: g.color, count: cardsFor(g).length }))} />
      </main>
    </>
  );
}
