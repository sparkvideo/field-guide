// Pinned plays and objections, kept on this phone only (localStorage).

export type Pin = { href: string; title: string; label: string };

const KEY = "fg-pins";

export function getPins(): Pin[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Pin[];
  } catch {
    return [];
  }
}

export function togglePin(pin: Pin): boolean {
  const pins = getPins();
  const has = pins.some((p) => p.href === pin.href);
  const next = has ? pins.filter((p) => p.href !== pin.href) : [...pins, pin];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return !has;
}

/** Small helpers for one-time notes ("don't show this again"). */
export function seen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
export function markSeen(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {}
}

// The last play or objection opened (kept short so Home stays simple).
const RECENT_KEY = "fg-recent";

export function getRecent(): Pin[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as Pin[];
  } catch {
    return [];
  }
}

export function addRecent(pin: Pin) {
  try {
    const next = [pin, ...getRecent().filter((p) => p.href !== pin.href)].slice(0, 1);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {}
}
