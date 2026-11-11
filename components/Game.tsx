"use client";
// "Go and Tell": a small side-scroller in the style of an early PlayStation game, just for fun.
// You are a disciple. Walk left or right, tackle someone, then tell them Jesus loves them.
// Clear a level, walk to church to be restored, and go back out bold (Acts 4:31).
// Flaming arrows fall from the sky; raise the shield of faith to put them out (Eph 6:16).
// The rules live here; the 3D picture is drawn by components/game3d.ts.

import { useEffect, useRef, useState } from "react";
import { useKeepAwake } from "./KeepAwake";
import { createStage, VIEW_W, VIEW_H, type Look, type PickupKind, type Rig, type Stage } from "./game3d";

const OW = 960; // the text layer on top of the 3D picture
const OH = 540;
const S = 0.1; // game units to metres in the 3D scene
const GROUND = 88; // y of everyone's feet, in game units
const LIVES = 3;
const BEST_KEY = "fg-game-best2";
const SOUND_KEY = "fg-game-sound";

const SHIRTS = ["#c0453a", "#3f7fbf", "#4f9d69", "#8a5fbf", "#d08a2e", "#3aa7a3", "#b84f86", "#6d7684"];
const PANTS = ["#2c3350", "#3b3b46", "#4a3728", "#1f3a3a"];
const SKINS = ["#f0c9a0", "#d9a273", "#a8744c", "#7a4f32"];
const HAIRS = ["#231a14", "#5b3a1e", "#c9a24b", "#8d8d93", "#a33c1f"];
const REPLIES = ["REALLY?", "THANK YOU!", "I NEEDED THAT", "TELL ME MORE", "OK! OK!", "HE DOES?", "WOW", "AMEN!", "ME?"];
const PLACES = ["THE STREET", "THE MARKETPLACE", "THE CITY GATE", "ARROW STORM"];
const PICKUP_NAMES: Record<PickupKind, string> = { sandals: "SANDALS OF PEACE!", helmet: "HELMET OF SALVATION!", sword: "SWORD OF THE SPIRIT!" };

// walker, jogger, runner and phone are ordinary passers-by.
// protester: holds a placard that knocks back your first tackle.
// preacher: a prosperity preacher who throws coins; a coin that hits you slows you down.
// skeptic: hops out of the way of a tackle he sees coming.
// last: the one person at the end of an arrow storm.
type Kind = "walker" | "jogger" | "runner" | "phone" | "protester" | "preacher" | "skeptic" | "last";
type Npc = {
  x: number; dir: number; kind: Kind; look: Look; walk: number;
  told: boolean; pinned: boolean; bolt: number; turn: number; say: string; sayT: number;
  guard: boolean; coinT: number; tossT: number; hop: number; dodgeCd: number;
  z: number; rig: Rig | null;
};
type Arrow = { x: number; y: number; vx: number; vy: number; tx: number };
type Bit = { x: number; y: number; vx: number; vy: number; t: number; heart: boolean };
type Coin = { x: number; vx: number; t: number };

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rnd(a.length)];
const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};
const blockAt = (cell: number) => (cell !== 0 && hash(cell) < 0.4 ? cell * 230 + 40 + hash(cell + 9) * 150 : null);

function newNpc(x: number, level: number, force?: Kind): Npc {
  let kind: Kind;
  const special = Math.min(0.5, 0.14 + level * 0.07);
  const roll = Math.random();
  if (force) kind = force;
  else if (roll < special) kind = pick<Kind>(["protester", "preacher", "skeptic"]);
  else {
    const r = Math.random();
    const hard = Math.min(level, 8) / 20;
    kind = r < 0.2 ? "phone" : r < 0.6 - hard ? "walker" : r < 0.8 ? "jogger" : "runner";
  }
  const look: Look = { shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hair: pick(HAIRS) };
  if (kind === "preacher") { look.shirt = "#e8c34a"; look.pants = "#f6efd8"; }
  if (kind === "skeptic") look.shirt = "#55606e";
  if (kind === "last") { look.shirt = "#7a1f2a"; look.pants = "#1d1a24"; }
  return {
    x, dir: Math.random() < 0.5 ? -1 : 1, kind, look, walk: Math.random() * 10,
    told: false, pinned: false, bolt: 0, turn: 1 + Math.random() * 3, say: "", sayT: 0,
    guard: kind === "protester", coinT: 1 + Math.random(), tossT: 0, hop: 0, dodgeCd: 0,
    z: -0.9 + Math.random() * 1.1, rig: null,
  };
}

type Mode = "title" | "play" | "over";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const [broken, setBroken] = useState(false);
  const keys = useRef({ left: false, right: false, jump: false, act: false, shield: false, jumpHit: false, actHit: false });
  const soundRef = useRef(true);
  const [sound, setSound] = useState(true);
  const [pinning, setPinning] = useState(false);
  const [mode, setMode] = useState<Mode>("title");
  useKeepAwake(mode === "play");

  useEffect(() => {
    try {
      const on = localStorage.getItem(SOUND_KEY) !== "off";
      soundRef.current = on;
      setSound(on);
    } catch {}

    let stage: Stage;
    try {
      stage = createStage(canvasRef.current!);
    } catch {
      setBroken(true);
      return;
    }
    const hud = hudRef.current!.getContext("2d")!;

    // ----- sound: tiny synth notes made on the spot, so there are no audio files -----
    let audio: AudioContext | null = null;
    const wake = () => {
      try {
        audio = audio ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (audio.state === "suspended") audio.resume();
      } catch {}
    };
    const tone = (freq: number, dur: number, type: OscillatorType = "square", delay = 0, vol = 0.06) => {
      if (!audio || !soundRef.current) return;
      const o = audio.createOscillator();
      const g = audio.createGain();
      const t0 = Math.max(audio.currentTime, audio.currentTime + delay);
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(audio.destination);
      o.start(t0);
      o.stop(t0 + dur);
    };
    const sfx = {
      pin: () => { tone(160, 0.12, "sawtooth"); tone(110, 0.16, "sawtooth", 0.05); },
      tell: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "square", i * 0.08)),
      block: () => { tone(1320, 0.08, "triangle", 0, 0.1); tone(1760, 0.2, "triangle", 0.06, 0.1); },
      hit: () => { tone(140, 0.3, "sawtooth", 0, 0.09); tone(90, 0.35, "square", 0.08, 0.07); },
      miss: () => tone(200, 0.12, "triangle"),
      jump: () => tone(440, 0.09, "triangle"),
      coin: () => { tone(988, 0.06, "square", 0, 0.04); tone(1319, 0.1, "square", 0.05, 0.04); },
      pickup: () => [659, 880, 1175].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.06, 0.09)),
      church: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, "triangle", i * 0.12, 0.08)),
      clear: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, "square", i * 0.09)),
      end: () => [784, 659, 523, 392].forEach((f, i) => tone(f, 0.26, "square", i * 0.16)),
    };
    // Music: one song on a loop while a round is being played. Phones only let sound start
    // from a tap, so the first tap or key press unlocks it.
    const song = new Audio("/audio/theme.mp3");
    song.loop = true;
    song.volume = 0.38;
    song.preload = "auto";
    let unlocked = false;
    const unlock = () => {
      if (unlocked || !soundRef.current) return;
      song.play().then(() => { unlocked = true; if (s.mode !== "play") song.pause(); }).catch(() => {});
    };
    const music = () => {
      const want = unlocked && soundRef.current && s.mode === "play" && !document.hidden;
      if (want && song.paused) song.play().catch(() => {});
      else if (!want && !song.paused && unlocked) song.pause();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}

    const s = {
      mode: "title" as Mode, t: 0, overT: 0, newBest: false,
      score: 0, told: 0, lives: LIVES, level: 0, theme: 0, target: 4, stageTold: 0, levelT: 0,
      phase: "play" as "play" | "church", churchX: 0, boss: null as Npc | null,
      streak: 0, streakT: 0, banner: "", bannerT: 0, fade: 0, shake: 0, zoom: 0,
      speedT: 0, helmet: false, bold: 0, slow: 0,
      pickup: null as { kind: PickupKind; x: number; t: number } | null, pickT: 8,
      p: { x: 0, y: GROUND, vy: 0, face: 1, walk: 0, lunge: 0, cool: 0, down: 0, stun: 0, pin: null as Npc | null, pinT: 0, tell: 0 },
      moving: false, npcs: [] as Npc[], bits: [] as Bit[], arrows: [] as Arrow[], coins: [] as Coin[],
      arrowT: 5, shielding: false, blocked: 0, flash: "", flashT: 0,
    };

    const say = (text: string, time = 2.2) => { s.banner = text; s.bannerT = time; };
    const clearNpcs = () => {
      for (const n of s.npcs) if (n.rig) stage.freeRig(n.rig);
      s.npcs = [];
    };
    const release = () => {
      if (s.p.pin) s.p.pin.pinned = false;
      s.p.pin = null;
      setPinning(false);
    };

    const beginLevel = () => {
      const i = s.level;
      const stageNo = i % 4;
      const loop = Math.floor(i / 4);
      const storm = stageNo === 3;
      s.theme = storm ? 2 : stageNo;
      stage.setTheme(s.theme);
      s.target = storm ? 1 : 4 + stageNo + loop * 2;
      s.stageTold = 0; s.levelT = 0; s.phase = "play"; s.fade = 1;
      s.arrows = []; s.coins = []; s.arrowT = storm ? 1.5 : 4;
      s.boss = null;
      if (storm) {
        clearNpcs();
        s.boss = newNpc(s.p.x + 420, i, "last");
        s.boss.dir = -1;
        s.npcs.push(s.boss);
        say("ARROW STORM: REACH THE LAST ONE", 2.8);
      } else say(`LEVEL ${i + 1}: ${PLACES[stageNo]}`);
    };

    const start = () => {
      s.mode = "play"; s.score = 0; s.told = 0; s.lives = LIVES; s.level = 0; s.newBest = false;
      s.streak = 0; s.streakT = 0; s.speedT = 0; s.helmet = false; s.bold = 0; s.slow = 0; s.pickup = null; s.pickT = 8;
      s.blocked = 0; s.shake = 0; s.zoom = 0;
      Object.assign(s.p, { x: 0, y: GROUND, vy: 0, face: 1, lunge: 0, cool: 0, down: 0, stun: 0, pin: null, pinT: 0, tell: 0 });
      clearNpcs();
      s.bits = [];
      beginLevel();
      s.npcs = [newNpc(45, 0, "phone"), newNpc(-60, 0, "walker"), newNpc(100, 0, "walker")];
      setMode("play");
      setPinning(false);
    };

    const gameOver = () => {
      s.mode = "over"; s.overT = 0;
      release();
      if (s.score > best) {
        best = s.score; s.newBest = true;
        try { localStorage.setItem(BEST_KEY, String(best)); } catch {}
      }
      setMode("over");
      sfx.end();
    };

    const hurt = () => {
      const p = s.p;
      if (p.pin) { p.pin.bolt = 3; release(); }
      p.down = 0.8; p.lunge = 0; p.vy = 0; p.y = GROUND; p.tell = 0;
      s.lives--; s.streak = 0; s.streakT = 0; s.shake = 0.35;
      s.flash = "OUCH!"; s.flashT = 1;
      sfx.hit();
      if (s.lives <= 0) gameOver();
    };

    const update = (dt: number) => {
      const k = keys.current;
      const jump = k.jumpHit;
      const act = k.actHit;
      k.jumpHit = false;
      k.actHit = false;
      s.t += dt;
      s.fade = Math.max(0, s.fade - dt * 1.6);
      s.shake = Math.max(0, s.shake - dt * 0.9);

      if (s.mode !== "play") {
        if (s.mode === "over") s.overT += dt;
        if ((act || jump) && (s.mode === "title" || s.overT > 1)) start();
        return;
      }

      const p = s.p;
      s.levelT += dt;
      s.bannerT = Math.max(0, s.bannerT - dt);
      s.flashT = Math.max(0, s.flashT - dt);
      s.speedT = Math.max(0, s.speedT - dt);
      s.bold = Math.max(0, s.bold - dt);
      s.slow = Math.max(0, s.slow - dt);
      if (s.streakT > 0) { s.streakT -= dt; if (s.streakT <= 0) s.streak = 0; }
      s.zoom += ((p.pin ? 1.5 : 0) - s.zoom) * Math.min(1, dt * 6);
      p.cool = Math.max(0, p.cool - dt);
      s.shielding = k.shield && p.down <= 0 && p.lunge <= 0 && p.tell <= 0 && p.y >= GROUND;
      const bold = s.bold > 0;

      if (p.pin) {
        // Holding someone down: tell them, or they wriggle free.
        if (p.tell > 0) {
          p.tell -= dt;
          if (p.tell <= 0) {
            const n = p.pin;
            n.told = true; n.sayT = 1.5; n.dir = Math.random() < 0.5 ? -1 : 1;
            n.say = n.kind === "preacher" ? "GRACE IS FREE?!" : n.kind === "protester" ? "I'M LISTENING." : n.kind === "skeptic" ? "HUH. OKAY." : n.kind === "last" ? "TELL ME MORE!" : pick(REPLIES);
            s.streak = s.streakT > 0 ? Math.min(5, s.streak + 1) : 1;
            s.streakT = 6;
            s.score += (n.kind === "last" ? 10 : n.kind === "walker" || n.kind === "phone" ? 1 : 2) * s.streak;
            s.told++; s.stageTold++;
            sfx.tell();
            for (let i = 0; i < 6; i++) s.bits.push({ x: n.x - 2, y: GROUND - 14, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 30, t: 0.9, heart: true });
            release();
            p.x -= 10 * p.face; p.cool = 0.25;
            if (s.stageTold >= s.target && s.phase === "play") {
              s.phase = "church"; s.churchX = p.x + 150; s.arrows = []; s.coins = []; s.boss = null; s.pickup = null;
              say(n.kind === "last" ? "STORM OVER! GO TO CHURCH" : "LEVEL CLEAR! GO TO CHURCH", 2.6);
              sfx.clear();
            }
          }
        } else {
          if (!bold) p.pinT -= dt;
          if (act) p.tell = bold ? 0.4 : 1.0;
          else if (p.pinT <= 0) {
            const n = p.pin;
            n.bolt = 3; n.dir = Math.random() < 0.5 ? -1 : 1; n.say = "HEY!"; n.sayT = 0.8;
            release();
            p.down = 0.4;
          }
        }
      } else if (p.down > 0) {
        p.down -= dt;
      } else {
        let vx = 0;
        if (p.lunge > 0) {
          p.lunge -= dt;
          vx = 165 * p.face;
          let bounced = false;
          for (const n of s.npcs) {
            if (n.told || n.pinned || n.hop > 0 || Math.abs(n.x - p.x) >= 9 || p.y <= GROUND - 16) continue;
            if (n.kind === "protester" && n.guard && !bold) {
              n.guard = false; n.say = "NOT TODAY!"; n.sayT = 1; n.bolt = 2.2;
              p.lunge = 0; p.down = 0.35; p.x -= 14 * p.face; s.shake = 0.15; bounced = true;
              sfx.miss();
              break;
            }
            n.pinned = true; n.bolt = 0; n.sayT = 0; n.guard = false;
            p.pin = n; p.pinT = 2.6; p.tell = 0; p.lunge = 0; p.x = n.x; p.y = GROUND; p.vy = 0;
            s.shake = 0.12;
            setPinning(true);
            sfx.pin();
            for (let i = 0; i < 5; i++) s.bits.push({ x: n.x, y: GROUND - 1, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 20, t: 0.4, heart: false });
            break;
          }
          if (!p.pin && !bounced && p.lunge <= 0 && p.y >= GROUND) {
            p.down = 0.45; // missed: face-plant
            sfx.miss();
            for (let i = 0; i < 4; i++) s.bits.push({ x: p.x + 6 * p.face, y: GROUND - 1, vx: (Math.random() - 0.5) * 50, vy: -15 - Math.random() * 15, t: 0.35, heart: false });
          }
        } else if (p.stun > 0) {
          p.stun -= dt;
        } else if (s.shielding) {
          // standing firm behind the shield
        } else {
          const speed = 55 * (s.speedT > 0 ? 1.5 : 1) * (bold ? 1.35 : 1) * (s.slow > 0 ? 0.45 : 1);
          if (k.left) { vx = -speed; p.face = -1; }
          if (k.right) { vx = speed; p.face = 1; }
          if (jump && p.y >= GROUND) { p.vy = -165; sfx.jump(); }
          if (act && p.cool <= 0) {
            p.lunge = 0.26; p.cool = 0.6;
            // a skeptic who sees it coming hops out of the way
            if (!bold) for (const n of s.npcs) {
              const dx = n.x - p.x;
              if (n.kind === "skeptic" && !n.told && !n.pinned && n.dodgeCd <= 0 && Math.abs(dx) < 50 && Math.sign(dx) === p.face) {
                n.hop = 0.6; n.dodgeCd = 3; n.say = "NOPE!"; n.sayT = 0.7;
              }
            }
          }
        }
        if (!p.pin) {
          const before = p.x;
          p.x += vx * dt;
          s.moving = !!vx;
          if (vx) p.walk += dt * 9;
          p.vy += 520 * dt;
          p.y = Math.min(GROUND, p.y + p.vy * dt);
          if (p.y >= GROUND) p.vy = 0;
          // Hydrants and crates: jump them or trip.
          if (p.y > GROUND - 5 && p.lunge <= 0 && vx) {
            const cell = Math.floor(p.x / 230);
            for (const c of [cell - 1, cell, cell + 1]) {
              const hx = blockAt(c);
              if (hx !== null && Math.abs(p.x - hx) < 5 && Math.abs(before - hx) >= 5) {
                p.x = before; p.stun = 0.35; s.flash = "OOF!"; s.flashT = 0.5;
              }
            }
          }
        }
      }

      // Church: walk in to be restored, come out bold.
      if (s.phase === "church" && !p.pin && Math.abs(p.x - s.churchX) < 9 && p.y >= GROUND) {
        s.lives = LIVES; s.bold = 9; s.slow = 0;
        s.level++;
        sfx.church();
        beginLevel();
        s.flash = "RESTORED!"; s.flashT = 1.4;
      }

      // Everyone else
      const mul = 1 + Math.min(s.level, 10) * 0.05;
      for (const n of s.npcs) {
        n.sayT = Math.max(0, n.sayT - dt);
        n.hop = Math.max(0, n.hop - dt);
        n.dodgeCd = Math.max(0, n.dodgeCd - dt);
        n.tossT = Math.max(0, n.tossT - dt);
        if (n.pinned) { n.walk += dt * 14; continue; }
        let v = 0;
        const dx = n.x - p.x;
        const near = Math.abs(dx);
        if (n.told) v = 9 * n.dir;
        else if (n.bolt > 0) { n.bolt -= dt; n.dir = dx >= 0 ? 1 : -1; v = 78 * n.dir; }
        else if (n.kind === "walker" || n.kind === "skeptic" || n.kind === "protester") v = 13 * n.dir * mul;
        else if (n.kind === "jogger") v = 36 * n.dir * mul;
        else if (n.kind === "runner") {
          if (near < 48) { n.dir = dx >= 0 ? 1 : -1; v = 50 * n.dir * mul; }
          else v = 8 * n.dir;
        } else if (n.kind === "preacher") {
          if (near < 85 && s.phase === "play") {
            n.dir = dx >= 0 ? -1 : 1;
            n.coinT -= dt;
            if (n.coinT <= 0 && s.coins.length < 6) {
              n.coinT = 1.7; n.tossT = 0.35;
              s.coins.push({ x: n.x + n.dir * 4, vx: n.dir * 75, t: 2.4 });
            }
          } else v = 7 * n.dir;
        } else if (n.kind === "last") n.dir = dx >= 0 ? -1 : 1;
        if (n.told || ((n.kind === "walker" || n.kind === "skeptic" || n.kind === "protester" || n.kind === "preacher" || n.kind === "runner") && v !== 0 && Math.abs(v) < 20)) {
          n.turn -= dt;
          if (n.turn <= 0) { n.turn = 2 + Math.random() * 3; if (Math.random() < 0.5) n.dir *= -1; }
        }
        n.x += v * dt;
        if (v) n.walk += dt * Math.min(12, 4 + Math.abs(v) / 6);
      }
      s.npcs = s.npcs.filter((n) => {
        const keep = n.pinned || n === s.boss || Math.abs(n.x - p.x) < 300;
        if (!keep && n.rig) { stage.freeRig(n.rig); n.rig = null; }
        return keep;
      });
      if (s.phase === "play" && !s.boss) {
        while (s.npcs.filter((n) => !n.told).length < 5) {
          const side = Math.random() < 0.6 ? p.face : -p.face;
          s.npcs.push(newNpc(p.x + side * (112 + Math.random() * 90), s.level));
        }
      }

      // Coins from the prosperity preacher: jump them or block them, or they slow you down.
      for (const c of s.coins) {
        c.x += c.vx * dt; c.t -= dt;
        if (c.t > 0 && Math.abs(c.x - p.x) < 5 && p.y > GROUND - 6 && !p.pin && p.down <= 0) {
          c.t = 0;
          if (!s.shielding) { s.slow = 2.5; s.flash = "DISTRACTED!"; s.flashT = 0.9; sfx.coin(); }
        }
      }
      s.coins = s.coins.filter((c) => c.t > 0);

      // Armor to pick up (Eph 6:13-17)
      if (s.phase === "play") {
        if (s.pickup) {
          s.pickup.t -= dt;
          if (Math.abs(s.pickup.x - p.x) < 8 && p.y > GROUND - 14 && !p.pin) {
            const kind = s.pickup.kind;
            if (kind === "sandals") s.speedT = 7;
            else if (kind === "helmet") s.helmet = true;
            else {
              for (const a of s.arrows) for (let i = 0; i < 3; i++) s.bits.push({ x: a.x, y: a.y, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 20, t: 0.4, heart: false });
              s.arrows = []; s.arrowT = 4.5;
            }
            say(PICKUP_NAMES[kind], 1.4);
            sfx.pickup();
            s.pickup = null; s.pickT = 10 + Math.random() * 6;
          } else if (s.pickup.t <= 0 || Math.abs(s.pickup.x - p.x) > 260) { s.pickup = null; s.pickT = 6; }
        } else {
          s.pickT -= dt;
          if (s.pickT <= 0) {
            const kinds: PickupKind[] = s.helmet ? ["sandals", "sword"] : ["sandals", "helmet", "sword"];
            s.pickup = { kind: pick(kinds), x: p.x + p.face * (75 + Math.random() * 50), t: 13 };
          }
        }
      }

      // Flaming arrows (Eph 6:16)
      if (s.phase === "play") {
        s.arrowT -= dt;
        if (s.arrowT <= 0 && s.arrows.length < 10) {
          const gap = s.boss ? 0.55 : Math.max(0.9, 3.2 - s.level * 0.2 - s.levelT * 0.02);
          s.arrowT = gap * (0.7 + Math.random() * 0.6);
          const tx = p.x + (Math.random() - 0.5) * 44 + (k.left ? -30 : k.right ? 30 : 0);
          const lean = Math.random() < 0.5 ? -1 : 1;
          const fall = 1.25;
          s.arrows.push({ x: tx - lean * 46, y: -8, vx: (lean * 46) / fall, vy: (GROUND + 8) / fall, tx });
        }
      }
      for (const a of s.arrows) {
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (Math.abs(a.x - p.x) < 7 && a.y > p.y - 21 && a.y < p.y && p.down <= 0) {
          a.y = 999;
          if (s.shielding || s.helmet) {
            if (s.shielding) { s.blocked++; s.flash = "FAITH!"; } else { s.helmet = false; s.flash = "HELMET!"; }
            s.flashT = 0.7; sfx.block();
            for (let i = 0; i < 6; i++) s.bits.push({ x: p.x, y: p.y - 20, vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 30, t: 0.4, heart: false });
          } else {
            hurt();
            if (s.mode !== "play") return;
          }
        } else if (a.y >= GROUND) {
          a.y = 999;
          for (let i = 0; i < 3; i++) s.bits.push({ x: a.x, y: GROUND - 1, vx: (Math.random() - 0.5) * 40, vy: -15 - Math.random() * 15, t: 0.3, heart: false });
        }
      }
      s.arrows = s.arrows.filter((a) => a.y < 900);

      for (const b of s.bits) { b.t -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += (b.heart ? 20 : 160) * dt; }
      s.bits = s.bits.filter((b) => b.t > 0);
    };

    // ----- text on top of the 3D picture: score, lives, speech -----
    const face = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
    const label = (text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left") => {
      hud.font = `900 italic ${size}px ${face}`;
      hud.textAlign = align;
      hud.textBaseline = "top";
      hud.lineJoin = "round";
      hud.lineWidth = Math.max(4, size / 6);
      hud.strokeStyle = "#0b0d14";
      hud.strokeText(text, x, y);
      hud.fillStyle = color;
      hud.fillText(text, x, y);
    };
    const heartIcon = (x: number, y: number, full: boolean) => {
      hud.beginPath();
      hud.moveTo(x, y + 26);
      hud.bezierCurveTo(x - 30, y + 4, x - 14, y - 12, x, y + 4);
      hud.bezierCurveTo(x + 14, y - 12, x + 30, y + 4, x, y + 26);
      hud.lineWidth = 5;
      hud.strokeStyle = "#0b0d14";
      hud.stroke();
      hud.fillStyle = full ? "#ff5c7a" : "rgba(11,13,20,0.55)";
      hud.fill();
    };
    const speech = (text: string, wx: number, wy: number) => {
      const [fx, fy] = stage.project(wx, wy, 0);
      hud.font = `900 26px ${face}`;
      const w = hud.measureText(text).width + 28;
      const x = Math.max(8, Math.min(OW - w - 8, fx * OW - w / 2));
      const y = Math.max(96, fy * OH - 46);
      hud.fillStyle = "#0b0d14";
      hud.fillRect(x - 4, y - 4, w + 8, 48);
      hud.fillStyle = "#fff8e7";
      hud.fillRect(x, y, w, 40);
      const tx = Math.max(x + 14, Math.min(x + w - 26, fx * OW - 6));
      hud.fillStyle = "#0b0d14";
      hud.beginPath(); hud.moveTo(tx - 4, y + 40); hud.lineTo(tx + 20, y + 40); hud.lineTo(tx + 8, y + 58); hud.fill();
      hud.fillStyle = "#fff8e7";
      hud.beginPath(); hud.moveTo(tx, y + 38); hud.lineTo(tx + 16, y + 38); hud.lineTo(tx + 8, y + 51); hud.fill();
      hud.fillStyle = "#0b0d14";
      hud.textAlign = "left";
      hud.textBaseline = "top";
      hud.fillText(text, x + 14, y + 6);
    };

    const draw = () => {
      const p = s.p;
      const cx = p.x * S;
      stage.setCamera(cx, s.t, s.shake, s.zoom);

      const hx: number[] = [];
      const cell = Math.floor(p.x / 230);
      for (const c of [cell - 1, cell, cell + 1]) {
        const h = blockAt(c);
        if (h !== null && Math.abs(h - p.x) < 150) hx.push(h * S);
      }
      stage.setBlocks(hx);

      for (const n of s.npcs) {
        if (!n.rig) n.rig = stage.takeRig(n.look);
        const still = (n.kind === "phone" || n.kind === "last" || (n.kind === "preacher" && Math.abs(n.x - p.x) < 85)) && !n.told && n.bolt <= 0;
        stage.pose(n.rig, {
          x: n.x * S, y: n.hop > 0 ? Math.sin(Math.PI * (1 - n.hop / 0.6)) * 1.3 : 0, z: n.pinned ? 0 : n.z, face: n.dir,
          phase: still ? 0 : n.walk * 1.2, mode: n.pinned ? "lie" : "stand", flail: n.pinned, happy: n.told,
          phone: n.kind === "phone" && still && !n.pinned, sign: n.kind === "protester" && n.guard,
          glasses: n.kind === "skeptic", toss: n.tossT > 0 && !n.pinned, t: s.t,
        });
      }
      const py = (GROUND - p.y) * S;
      if (p.pin) stage.pose(stage.player, { x: cx, y: 0.36, z: 0.06, face: p.face, phase: 0, mode: "kneel", reach: !s.shielding, shield: s.shielding, helmet: s.helmet, t: s.t });
      else if (p.down > 0) stage.pose(stage.player, { x: cx, y: 0, z: 0, face: p.face, phase: 0, mode: "lie", helmet: s.helmet, t: s.t });
      else if (p.lunge > 0) stage.pose(stage.player, { x: cx, y: py, z: 0, face: p.face, phase: 0, mode: "dive", reach: true, helmet: s.helmet, t: s.t });
      else stage.pose(stage.player, { x: cx, y: py, z: 0, face: p.face, phase: s.moving ? p.walk * 1.2 : 0, mode: "stand", shield: s.shielding, helmet: s.helmet, t: s.t });

      const playing = s.mode === "play";
      stage.setArrows(s.arrows.map((a) => ({ x: a.x * S, y: (GROUND - a.y) * S, vx: a.vx, vy: -a.vy, tx: a.tx * S })), s.t);
      stage.setBits(s.bits.map((b) => ({ x: b.x * S, y: (GROUND - b.y) * S, heart: b.heart, t: b.t })));
      stage.setCoins(s.coins.map((c) => c.x * S), s.t);
      stage.setPickup(playing && s.pickup ? { kind: s.pickup.kind, x: s.pickup.x * S } : null, s.t);
      stage.setBeacon(playing && s.boss && !s.boss.told ? s.boss.x * S : null, s.t);
      stage.setBold(playing && s.bold > 0, cx, py, s.t);
      stage.setChurch(playing && s.phase === "church" ? s.churchX * S : null);
      stage.render();

      hud.clearRect(0, 0, OW, OH);
      if (playing) for (const n of s.npcs) if (n.sayT > 0) speech(n.say, n.x * S, 2.2);
      if (playing && p.pin) {
        if (p.tell > 0) speech("JESUS LOVES YOU!", cx, 2.7);
        else if (Math.floor(s.t * 5) % 2 === 0) speech("TELL THEM!", cx, 2.7);
      }
      if (playing && s.flashT > 0 && !(p.pin && p.tell > 0)) speech(s.flash, cx, py + (p.pin ? 3.6 : 2.9));

      if (playing) {
        label(`SCORE ${s.score}`, 22, 14, 38, "#fff8e7");
        const storm = s.boss !== null;
        label(s.phase === "church" ? "GO TO CHURCH" : storm ? "REACH THE LAST ONE" : `LEVEL ${s.level + 1}   ${s.stageTold}/${s.target}`, 24, 58, 22, s.phase === "church" ? "#ffe9a8" : "#d4b062");
        for (let i = 0; i < LIVES; i++) heartIcon(OW - 40 - i * 52, 22, i < s.lives);
        if (s.streak > 1 && s.streakT > 0) {
          label(`x${s.streak}`, OW / 2, 12, 50, "#ffd24a", "center");
          hud.fillStyle = "#0b0d14"; hud.fillRect(OW / 2 - 62, 70, 124, 10);
          hud.fillStyle = "#ffd24a"; hud.fillRect(OW / 2 - 60, 72, 120 * (s.streakT / 6), 6);
        }
        const buffs: string[] = [];
        if (s.bold > 0) buffs.push(`BOLD ${Math.ceil(s.bold)}`);
        if (s.speedT > 0) buffs.push(`SANDALS ${Math.ceil(s.speedT)}`);
        if (s.helmet) buffs.push("HELMET");
        if (s.slow > 0) buffs.push("SLOWED");
        buffs.forEach((b, i) => label(b, 22, OH - 44 - i * 30, 22, b === "SLOWED" ? "#ff8f7a" : "#ffe9a8"));

        // pointers to things off the edge of the screen
        const far = s.phase === "church" ? s.churchX - p.x : s.boss && !s.boss.told ? s.boss.x - p.x : 0;
        if (Math.abs(far) > 62) {
          const right = far > 0;
          const what = s.phase === "church" ? "CHURCH" : "LAST ONE";
          label(right ? `${what} >` : `< ${what}`, right ? OW - 22 : 22, OH / 2 - 40, 28, "#ffe9a8", right ? "right" : "left");
        }
        if (s.phase === "church" && Math.abs(far) <= 80) {
          const [fx, fy] = stage.project(s.churchX * S, 7.4, -2.6);
          label("VALLEY BIBLE CHURCH", Math.max(190, Math.min(OW - 190, fx * OW)), Math.max(92, fy * OH), 22, "#fff8e7", "center");
        }
        if (s.bannerT > 0) {
          hud.fillStyle = "rgba(11,13,20,0.62)";
          hud.fillRect(0, 196, OW, 76);
          label(s.banner, OW / 2, 212, 40, "#d4b062", "center");
        }
        if (s.fade > 0) { hud.fillStyle = `rgba(255,248,231,${Math.min(1, s.fade)})`; hud.fillRect(0, 0, OW, OH); }
      } else {
        hud.fillStyle = "rgba(11,13,20,0.6)";
        hud.fillRect(0, 0, OW, OH);
        const blink = Math.floor(s.t * 2) % 2 === 0;
        if (s.mode === "title") {
          label("GO AND TELL", OW / 2, 54, 104, "#d4b062", "center");
          label("Catch them. Pin them. Tell them Jesus loves them.", OW / 2, 204, 30, "#fff8e7", "center");
          label("Raise your shield when the arrows fall. Three lives.", OW / 2, 246, 30, "#ff9a6a", "center");
          label("Clear a level, then go to church to be restored.", OW / 2, 288, 30, "#ffe9a8", "center");
          if (best > 0) label(`BEST ${best}`, OW / 2, 348, 34, "#d4b062", "center");
          if (blink) label("PRESS START", OW / 2, 430, 46, "#fff8e7", "center");
        } else {
          label("GAME OVER", OW / 2, 44, 96, "#d4b062", "center");
          label(`YOU TOLD ${s.told}`, OW / 2, 180, 60, "#fff8e7", "center");
          label(`SCORE ${s.score}   LEVEL ${s.level + 1}`, OW / 2, 262, 38, "#fff8e7", "center");
          label(s.newBest ? "NEW BEST!" : `BEST ${best}`, OW / 2, 322, 38, "#d4b062", "center");
          if (s.blocked > 0) label(`ARROWS BLOCKED ${s.blocked}`, OW / 2, 376, 28, "#ff9a6a", "center");
          if (s.overT > 1 && blink) label("PRESS AGAIN TO PLAY", OW / 2, 440, 40, "#fff8e7", "center");
        }
      }
    };

    // For testing: open /game#debug to reach the game's state from the browser console.
    if (window.location.hash === "#debug") (window as unknown as { __gt: unknown }).__gt = { s, beginLevel, newNpc };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      music();
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const map: Record<string, "left" | "right" | "jump" | "act" | "shield"> = {
      ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right",
      ArrowUp: "jump", w: "jump", " ": "jump", x: "act", Enter: "act", z: "act", ArrowDown: "shield", s: "shield", c: "shield",
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const k = map[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!k) return;
      if (down && !e.repeat) {
        if (k === "jump") keys.current.jumpHit = true;
        if (k === "act") keys.current.actHit = true;
      }
      keys.current[k] = down;
      e.preventDefault();
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      song.pause();
      song.src = "";
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      audio?.close().catch(() => {});
      stage.dispose();
    };
  }, []);

  const hold = (k: "left" | "right" | "jump" | "act" | "shield") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      keys.current[k] = true;
      if (k === "jump") keys.current.jumpHit = true;
      if (k === "act") keys.current.actHit = true;
    },
    onPointerUp: () => { keys.current[k] = false; },
    onPointerCancel: () => { keys.current[k] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const toggleSound = () => {
    const on = !sound;
    soundRef.current = on;
    setSound(on);
    try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch {}
  };

  return (
    <div className="game">
      <div className="game-frame">
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className="game-screen" aria-label="Go and Tell game screen" />
        <canvas ref={hudRef} width={OW} height={OH} className="game-hud" aria-hidden="true" />
        {broken && <p className="game-broken">This game needs 3D graphics, which this browser has turned off.</p>}
      </div>
      <div className="game-pad">
        <div className="game-move">
          <button type="button" className="game-btn" aria-label="Walk left" {...hold("left")}>‹</button>
          <button type="button" className="game-btn" aria-label="Walk right" {...hold("right")}>›</button>
        </div>
        <div className="game-acts">
          <button type="button" className="game-btn game-btn-text" {...hold("jump")}>Jump</button>
          <button type="button" className="game-btn game-btn-text" {...hold("shield")}>Shield</button>
          <button type="button" className="game-btn game-btn-text game-btn-main" {...hold("act")}>
            {mode === "title" ? "Start" : mode === "over" ? "Again" : pinning ? "Tell them" : "Tackle"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-right">
        <button type="button" className="link small" onClick={toggleSound} aria-pressed={sound}>
          Sound: {sound ? "on" : "off"}
        </button>
      </p>
      <div className="muted small" style={{ marginTop: 6 }}>
        <p>Tackle someone, then tell them before they wriggle free. Telling people quickly in a row multiplies your score.</p>
        <p className="mt-2">Hold Shield when flaming arrows fall (Ephesians 6:16). You have three lives.</p>
        <p className="mt-2">Clear a level, then walk to church. You are restored and go out bold for a few seconds (Acts 4:31).</p>
        <p className="mt-2">Watch for the placard that blocks your first tackle, the skeptic who hops away, and the prosperity preacher&rsquo;s coins: jump them or they slow you down.</p>
        <p className="mt-2">Pick up the sandals (speed), the helmet (one free hit) and the sword (clears the arrows).</p>
      </div>
    </div>
  );
}
