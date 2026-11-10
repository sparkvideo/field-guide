import { Md } from "@/components/Md";
import { TopBar } from "@/components/TopBar";
import { APP_TITLE, BSB_NOTICE, LSB_NOTICE, LSB_URL } from "@/lib/config";
import { guide } from "@/lib/guide";

export const metadata = { title: "About · Apologetics Field Guide" };

export default function AboutPage() {
  return (
    <>
      <TopBar back="/" />
      <main className="page">
        <h1 className="text-[28px] font-bold leading-tight">{APP_TITLE}</h1>
        {guide.intro
          .map((l) => ({ ...l, text: l.text.split("\n").filter((t) => !t.includes("▶")).join("\n") }))
          .filter((l) => l.text)
          .map((l, i) => (
          <p key={i} className="mt-4">
            <Md text={l.text} />
          </p>
        ))}

        <section className="section">
          <h2 className="label">Scripture</h2>
          <p className="small">
            Verses marked <span className="tag">LSB</span>: {LSB_NOTICE}{" "}
            <a className="link" href={LSB_URL} target="_blank" rel="noopener noreferrer">
              www.LSBible.org
            </a>
          </p>
          <p className="small mt-4">
            Verses marked <span className="tag">BSB</span>: {BSB_NOTICE}
          </p>
        </section>

        <section className="section">
          <h2 className="label">Privacy</h2>
          <p className="small">No accounts, no analytics, no tracking. Pins are saved only on this phone.</p>
        </section>
      </main>
    </>
  );
}
