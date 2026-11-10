"use client";
// A two-option switch. Remembers the choice while the app is open, so "back" returns to the same side.

import { useEffect, useState, type ReactNode } from "react";

export function Toggle({ id, labels, panels, hashForSecond }: { id: string; labels: [string, string]; panels: [ReactNode, ReactNode]; hashForSecond?: string }) {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (hashForSecond && window.location.hash === hashForSecond) return setTab(1);
    try {
      if (sessionStorage.getItem(`fg-tab-${id}`) === "1") setTab(1);
    } catch {}
  }, [id, hashForSecond]);
  const choose = (n: number) => {
    setTab(n);
    try {
      sessionStorage.setItem(`fg-tab-${id}`, String(n));
    } catch {}
  };
  return (
    <>
      <div className="toggle" role="tablist" aria-label="Choose">
        {labels.map((label, n) => (
          <button key={n} role="tab" id={`${id}-tab-${n}`} aria-selected={tab === n} aria-controls={`${id}-panel-${n}`} onClick={() => choose(n)}>
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, n) => (
        <div key={n} role="tabpanel" id={`${id}-panel-${n}`} aria-labelledby={`${id}-tab-${n}`} hidden={tab !== n} className="mt-5">
          {panel}
        </div>
      ))}
    </>
  );
}
