// Builds practice cards from lines already in the guide: every objection and every "If they say" line.
import { guide } from "./guide";
import type { Group, VerseRef } from "./types";

export type PracticeCard = { theySay: string; youSay: string; askBack?: string; verses: VerseRef[]; from: string; group: string };

function holySpiritCards(): PracticeCard[] {
  const hs = guide.holySpiritPlay;
  return [...hs.stepA.ifTheySay, ...hs.stepB.ifTheySay].map((b) => ({
    theySay: b.theySay,
    youSay: b.youSay,
    verses: b.verses,
    from: "The Holy Spirit",
    group: "Holy Spirit",
  }));
}

export function cardsFor(g: Group, withHolySpirit = true): PracticeCard[] {
  const usesHolySpirit = g.defense.some((o) => o.crossRef) || g.offense.some((p) => p.crossRef);
  return [
    ...g.defense
      .filter((o) => !o.crossRef)
      .map((o) => ({ theySay: o.objection, youSay: o.response, askBack: o.askBack, verses: o.verses, from: "Objection", group: g.name })),
    ...g.offense.flatMap((p) => p.ifTheySay.map((b) => ({ theySay: b.theySay, youSay: b.youSay, verses: b.verses, from: p.title, group: g.name }))),
    ...(withHolySpirit && usesHolySpirit ? holySpiritCards() : []),
  ];
}

/** Every card in the guide, once. */
export function allCards(): PracticeCard[] {
  return [...guide.groups.flatMap((g) => cardsFor(g, false)), ...holySpiritCards()];
}
