"use client";
// Keeps the phone's screen from dimming and locking while a play or objection is open.
// (Uses the browser's Screen Wake Lock. Phones that don't support it simply ignore this.)

import { useEffect } from "react";

type Lock = { release(): Promise<void> };

export function useKeepAwake(on = true) {
  useEffect(() => {
    const wl = (navigator as unknown as { wakeLock?: { request(type: "screen"): Promise<Lock> } }).wakeLock;
    if (!on || !wl) return;
    let lock: Lock | undefined;
    let stopped = false;
    const get = () => {
      if (document.visibilityState !== "visible") return;
      wl.request("screen")
        .then((l) => {
          if (stopped) l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {});
    };
    get();
    document.addEventListener("visibilitychange", get); // the lock is dropped when the app is put away
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", get);
      lock?.release().catch(() => {});
    };
  }, [on]);
}
