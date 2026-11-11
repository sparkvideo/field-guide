import data from "@/content/guide.json";
import type { Group, Guide } from "./types";

export const guide = data as unknown as Guide;

/** Groups that are launched (shown on the home screen, in search and in training). */
export const liveGroups = guide.groups.filter((g) => !g.hidden);

export function getGroup(slug: string): Group | undefined {
  return guide.groups.find((g) => g.slug === slug);
}

/** "JW" for Jehovah's Witness, otherwise the group name. */
export function shortName(g: Group): string {
  return g.slug === "jw" ? "JW" : g.name;
}
