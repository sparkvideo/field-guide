// Settings you may want to edit, all in one place.

export const APP_TITLE = "Field Guide: Apologetics";

// Legacy Standard Bible copyright notice, as required at LSBible.org/permission-to-quote-the-lsb/
// (checked November 2026). For apps, the notice must include a tappable link to LSBible.org.
export const LSB_NOTICE =
  "Scripture quotations taken from the (LSB®) Legacy Standard Bible®, Copyright © 2021 by The Lockman Foundation. Used by permission. All rights reserved. Managed in partnership with Three Sixteen Publishing Inc. LSBible.org and 316publishing.com.";
export const LSB_URL = "https://www.lsbible.org";

export const BSB_NOTICE =
  "All other Scripture is from the Berean Standard Bible (BSB), which is in the public domain. berean.bible";

/** Where "Open in LSB" goes. `ref` looks like "John 1:1-3" or "Psalms 95". */
export function lsbLink(ref: string): string {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=LSB`;
}

/** Where a Quran reference goes: quran.com/5/47 */
export function quranLink(sura: number, from: number, to?: number): string {
  return `https://quran.com/${sura}/${from}${to && to !== from ? `-${to}` : ""}`;
}

// Set in Vercel → Settings → Environment Variables (see README). Empty = notifications row is hidden.
export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
