import { TopBar } from "@/components/TopBar";
import { Game } from "@/components/Game";

export const metadata = { title: "Go and Tell · Apologetics Field Guide" };

export default function GamePage() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">Go and Tell</h1>
        <Game />
      </main>
    </>
  );
}
