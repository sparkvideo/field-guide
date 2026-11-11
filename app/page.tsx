import { Home } from "@/components/Home";
import { guide } from "@/lib/guide";

export default function Page() {
  return <Home groups={guide.groups.filter((g) => !g.hidden).map((g) => ({ slug: g.slug, name: g.name, color: g.color, plays: g.offense.length, objections: g.defense.length }))} />;
}
