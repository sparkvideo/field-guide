"use client";
// The bar at the top of every screen: back arrow on the left, pin and share on the right.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addRecent, getPins, togglePin, type Pin } from "@/lib/pins";
import { useKeepAwake } from "./KeepAwake";

export function TopBar({ back, pin, share }: { back?: string | "history"; pin?: Pin; share?: { title: string } }) {
  const router = useRouter();
  const [pinned, setPinned] = useState(false);
  const [copied, setCopied] = useState(false);

  useKeepAwake(!!pin); // plays, objections and the Holy Spirit play keep the screen on
  useEffect(() => {
    if (!pin) return;
    setPinned(getPins().some((p) => p.href === pin.href));
    addRecent(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.href]);

  const doShare = async () => {
    const data = { title: share!.title, text: share!.title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {}
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {back === "history" ? (
          <button className="icon-btn" aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}>
            ‹
          </button>
        ) : back ? (
          <Link className="icon-btn" href={back} aria-label="Back">
            ‹
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center">
          {pin && (
            <button
              className="icon-btn"
              aria-pressed={pinned}
              aria-label={pinned ? "Remove pin" : "Pin this"}
              onClick={() => setPinned(togglePin(pin))}
            >
              {pinned ? "★" : "☆"}
            </button>
          )}
          {share && (
            <button className="icon-btn" aria-label="Share" onClick={doShare}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {copied && (
        <div className="toast" role="status">
          Link copied
        </div>
      )}
    </header>
  );
}
