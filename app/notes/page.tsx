import { Notes } from "@/components/Personal";
import { TopBar } from "@/components/TopBar";

export const metadata = { title: "Conversation notes · Apologetics Field Guide" };

export default function NotesPage() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">Conversation notes</h1>
        <Notes />
      </main>
    </>
  );
}
