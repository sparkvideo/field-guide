"use client";
// Behind-the-scenes work for the installed app:
//  - turns on the offline worker (/sw.js)
//  - picks up new content after a redeploy
//  - downloads the Bible in the background and says so once

import { useEffect, useState } from "react";
import { markSeen, seen } from "@/lib/pins";

export function AppShell() {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const openedAt = Date.now();
    const hadWorker = !!navigator.serviceWorker.controller;
    let reloadWhenHidden = false;

    // A new version took over. Reload right away if the app was only just opened;
    // otherwise wait until the app is put away, so nobody loses their place mid-conversation.
    const onChange = () => {
      if (!hadWorker) return;
      if (Date.now() - openedAt < 12000) window.location.reload();
      else reloadWhenHidden = true;
    };
    const onHide = () => {
      if (reloadWhenHidden && document.visibilityState === "hidden") window.location.reload();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "bible-cached" && !seen("fg-bible-note")) {
        markSeen("fg-bible-note");
        setNote("Bible downloaded for offline ✓");
        setTimeout(() => setNote(""), 5000);
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    navigator.serviceWorker.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onHide);

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        reg.update().catch(() => {});
        return navigator.serviceWorker.ready;
      })
      .then((reg) => reg.active?.postMessage({ type: "cache-bible" }))
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  if (!note) return null;
  return (
    <div className="toast" role="status">
      {note}
    </div>
  );
}
