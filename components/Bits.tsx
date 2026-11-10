// Small shared pieces used on several screens.
import Link from "next/link";
import type { Branch } from "@/lib/types";
import { Md } from "./Md";
import { VerseChips } from "./VerseSheet";

/** Collapsed "If they say…" rows. Tap one to see the answer. */
export function Branches({ branches }: { branches: Branch[] }) {
  if (!branches.length) return null;
  return (
    <div className="rows">
      {branches.map((b, i) => (
        <details key={i} className="say" id={`say-${i + 1}`}>
          <summary>
            <span>
              <Md text={b.theySay} />
            </span>
          </summary>
          <div className="answer">
            <p className="text-[20px]">
              <Md text={b.youSay} />
            </p>
            <VerseChips verses={b.verses} context={b.youSay} />
            {b.crossRef && (
              <p className="mt-3">
                <Link className="link" href="/holy-spirit">
                  Open the Holy Spirit play ›
                </Link>
              </p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

export function Chevron() {
  return (
    <span className="chev" aria-hidden="true">
      ›
    </span>
  );
}
