"use client";
// The first screen someone sees when they open the link: how to put the app on their phone,
// how to use it, and one button to go in. It shows once per phone (and any time at /welcome).

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mark } from "./Icons";

type Device = "iphone-safari" | "iphone-other" | "android" | "computer";

export function Welcome({ always = false }: { always?: boolean }) {
  const router = useRouter();
  const [device, setDevice] = useState<Device>("iphone-safari");

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const safari = /safari/i.test(ua) && !/crios|fxios|edgios|gsa\/|fban|fbav|instagram/i.test(ua);
    setDevice(ios ? (safari ? "iphone-safari" : "iphone-other") : /android/i.test(ua) ? "android" : "computer");
  }, []);

  const enter = () => {
    try {
      localStorage.setItem("fg-welcome", "1");
      localStorage.setItem("fg-install-tip", "1");
    } catch {}
    document.documentElement.removeAttribute("data-welcome");
    window.scrollTo(0, 0);
    if (always) router.push("/");
  };

  return (
    <div className={`welcome${always ? " always" : ""}`}>
      <div className="page relative" style={{ paddingTop: "calc(env(safe-area-inset-top) + 30px)" }}>
        <div className="home-glow" aria-hidden="true" />
        <div className="brand">
          <Mark size={56} />
          <div>
            <p className="welcome-name">
              Apologetics
              <br />
              Field Guide
            </p>
          </div>
        </div>
        <p className="muted">Verses and answers for real conversations.</p>

        <section className="welcome-install" style={{ marginTop: 26 }}>
          <h2 className="label">Install it</h2>
          {device === "iphone-other" && (
            <p className="rows mb-3 p-3 small">
              Open this link in <strong>Safari</strong> first.
            </p>
          )}
          {device === "android" ? (
            <ol className="steps tight">
              <li>
                Open in <strong>Chrome</strong>
              </li>
              <li>
                Tap the <strong>⋮</strong> menu
              </li>
              <li>
                Tap <strong>Add to Home screen</strong>
              </li>
            </ol>
          ) : (
            <ol className="steps tight">
              <li>
                Open in <strong>Safari</strong>
              </li>
              <li>
                Tap <strong>Share</strong>{" "}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon inline-block align-[-3px]">
                  <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                </svg>
              </li>
              <li>
                Tap <strong>Add to Home Screen</strong>
              </li>
            </ol>
          )}
          <p className="muted small">Open it once with signal. After that it works offline.</p>
        </section>

        <section style={{ marginTop: 26 }}>
          <h2 className="label">Use it</h2>
          <ol className="steps tight">
            <li>Pick who you&rsquo;re talking to</li>
            <li>
              <strong>Make the case</strong> or <strong>answer an objection</strong>
            </li>
            <li>Tap a verse to read it, and end with the gospel</li>
          </ol>
        </section>

        <button className="btn primary mt-6 w-full" style={{ minHeight: 56, fontSize: 19 }} onClick={enter}>
          I&rsquo;m in
        </button>
      </div>
    </div>
  );
}
