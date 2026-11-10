import { Testimony } from "@/components/Personal";
import { TopBar } from "@/components/TopBar";

export const metadata = { title: "My testimony · Apologetics Field Guide" };

export default function TestimonyPage() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">My testimony</h1>
        <Testimony />
      </main>
    </>
  );
}
