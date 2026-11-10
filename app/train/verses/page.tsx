import index from "@/content/verse-index.json";
import verses from "@/content/guide-verses.json";
import { MemoryVerses } from "@/components/MemoryVerses";
import { TopBar } from "@/components/TopBar";

export const metadata = { title: "Verses to memorize · Apologetics Field Guide" };

// The twenty verses the guide leans on most (counted by how many places cite them).
// Only single verses and short ranges, so each one can actually be memorized.
export default function MemoryPage() {
  const refs = verses as unknown as Record<string, { ref: string; bsb: unknown[] }>;
  const top = Object.entries(index as Record<string, { label: string; uses: unknown[] }>)
    .filter(([key]) => refs[key] && refs[key].bsb.length <= 3)
    .map(([key, v]) => ({ key, ref: refs[key].ref, uses: v.uses.length }))
    .sort((a, z) => z.uses - a.uses)
    .slice(0, 20);
  return (
    <>
      <TopBar back="/train" />
      <main className="page">
        <h1 className="text-[26px] font-bold leading-tight">Verses to memorize</h1>
        <div className="mt-3">
          <MemoryVerses verses={top} />
        </div>
      </main>
    </>
  );
}
