"use client";
// "Go and Tell": a small 8-bit side-scroller, just for fun.
// You are a disciple. Walk left or right, tackle someone, then tell them Jesus loves them.
// Flaming arrows fall from the sky; raise the shield of faith to put them out (Eph 6:16).
// Everything is drawn in code on a 192x108 canvas, so there are no image files and it works offline.

import { useEffect, useRef, useState } from "react";
import { useKeepAwake } from "./KeepAwake";

const W = 192;
const H = 108;
const GROUND = 88; // y of everyone's feet
const ROUND = 60; // seconds
const BEST_KEY = "fg-game-best";

// ---------- tiny 3x5 pixel font ----------
const GLYPHS: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110",
  E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111",
  M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100",
  Q: "010101101111011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101",
  Y: "101101010010010", Z: "111001010100111",
  "0": "111101101101111", "1": "010110010010111", "2": "110001010100111", "3": "110001010001110",
  "4": "101101111001001", "5": "111100110001110", "6": "011100111101111", "7": "111001010010010",
  "8": "111101111101111", "9": "111101111001110",
  "!": "010010010000010", "?": "110001010000010", ".": "000000000000010", ",": "000000000010100",
  "'": "010010000000000", ":": "000010000010000", "-": "000000111000000",
};

function textWidth(s: string, scale = 1) {
  return (s.length * 4 - 1) * scale;
}

function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, scale = 1) {
  ctx.fillStyle = color;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) {
      for (let i = 0; i < 15; i++) {
        if (g[i] === "1") ctx.fillRect(cx + (i % 3) * scale, cy + Math.floor(i / 3) * scale, scale, scale);
      }
    }
    cx += 4 * scale;
  }
}

function centerText(ctx: CanvasRenderingContext2D, s: string, y: number, color: string, scale = 1) {
  const x = (W - textWidth(s, scale)) / 2;
  drawText(ctx, s, x + scale, y + scale, "#0b0d14", scale);
  drawText(ctx, s, x, y, color, scale);
}

function bubble(ctx: CanvasRenderingContext2D, s: string, cx: number, bottom: number) {
  const w = textWidth(s) + 8;
  const x = Math.max(2, Math.min(W - w - 2, Math.round(cx - w / 2)));
  const y = Math.max(12, Math.round(bottom - 13));
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(x - 1, y - 1, w + 2, 13);
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(x, y, w, 11);
  const tx = Math.max(x + 3, Math.min(x + w - 6, Math.round(cx)));
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(tx - 1, y + 11, 5, 1);
  ctx.fillRect(tx, y + 12, 3, 1);
  ctx.fillStyle = "#fff8e7";
  ctx.fillRect(tx, y + 11, 3, 1);
  ctx.fillRect(tx + 1, y + 12, 1, 1);
  drawText(ctx, s, x + 4, y + 3, "#0b0d14");
}

const HEART = [".#.#.", "#####", ".###.", "..#.."];
function heart(ctx: CanvasRenderingContext2D, x: number, y: number, color = "#e2556b") {
  ctx.fillStyle = color;
  HEART.forEach((row, j) => {
    for (let i = 0; i < 5; i++) if (row[i] === "#") ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
  });
}

// ---------- people ----------
type Look = { shirt: string; pants: string; skin: string; hair: string };
type Pose = { face: number; step: boolean; lying?: boolean; happy?: boolean; reach?: boolean; shield?: boolean };

function person(ctx: CanvasRenderingContext2D, cx: number, feet: number, disciple: boolean, look: Look, p: Pose) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(feet));
  if (p.lying) {
    ctx.translate(-8 * p.face, -5);
    ctx.rotate((Math.PI / 2) * p.face);
  }
  if (p.face < 0) ctx.scale(-1, 1);
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const a = p.step ? 1 : 0;
  if (disciple) {
    r(-2, -16, 4, 2, "#f1e7cf"); // head cloth
    r(-3, -15, 1, 3, "#f1e7cf");
    r(-2, -14, 4, 3, look.skin);
    r(1, -14, 1, 1, "#16110c");
    r(-1, -12, 3, 2, "#5b3a1e"); // beard
    r(-3, -10, 6, 8, "#d9c9a3"); // robe
    r(-3, -7, 6, 1, "#d4b062"); // sash
    r(-4, -10, 1, 4, "#c8b78e");
    if (p.reach) r(3, -9, 4, 1, look.skin);
    else r(3, -10, 1, 4, "#c8b78e");
    r(-3, -2, 2, 2 - a, look.skin); // sandals
    r(1, -2, 2, 1 + a, look.skin);
    r(-3, -1 + (a ? -1 : 0), 3, 1, "#6b4a2a");
    r(1, -1 + (a ? 0 : -1), 3, 1, "#6b4a2a");
    if (p.shield) {
      r(-4, -17, 1, 5, look.skin); // arms up
      r(3, -17, 1, 5, look.skin);
      r(-6, -21, 12, 1, "#8a6a2c"); // the shield of faith, held overhead
      r(-7, -20, 14, 3, "#d4b062");
      r(-6, -17, 12, 1, "#8a6a2c");
      r(-1, -20, 2, 3, "#fff8e7");
      r(-3, -19, 6, 1, "#fff8e7");
    }
  } else {
    r(-2, -16, 4, 1, look.hair);
    r(-3, -15, 1, 2, look.hair);
    r(-2, -15, 4, 4, look.skin);
    r(1, -14, 1, 1, "#16110c");
    if (p.happy) r(0, -12, 2, 1, "#ffffff");
    r(-3, -11, 6, 6, look.shirt);
    r(-4, -11, 1, 4, look.skin);
    r(3, -11, 1, 4, look.skin);
    r(-3, -5, 2, 4 + (1 - a), look.pants);
    r(1, -5, 2, 4 + a, look.pants);
    r(-3, -1 - a, 3, 1, "#1b1b1f");
    r(1, -2 + a, 3, 1, "#1b1b1f");
  }
  ctx.restore();
}

const SHIRTS = ["#c0453a", "#3f7fbf", "#4f9d69", "#8a5fbf", "#d08a2e", "#3aa7a3", "#b84f86", "#6d7684"];
const PANTS = ["#2c3350", "#3b3b46", "#4a3728", "#1f3a3a"];
const SKINS = ["#f0c9a0", "#d9a273", "#a8744c", "#7a4f32"];
const HAIRS = ["#231a14", "#5b3a1e", "#c9a24b", "#8d8d93", "#a33c1f"];
const REPLIES = ["REALLY?", "THANK YOU!", "I NEEDED THAT", "TELL ME MORE", "OK! OK!", "HE DOES?", "WOW", "AMEN!", "ME?"];

type Kind = "walker" | "jogger" | "runner" | "phone";
type Npc = {
  x: number; dir: number; kind: Kind; look: Look; walk: number;
  told: boolean; pinned: boolean; bolt: number; turn: number; say: string; sayT: number;
};
type Arrow = { x: number; y: number; vx: number; vy: number; tx: number };
type Bit = { x: number; y: number; vx: number; vy: number; t: number; heart: boolean };

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rnd(a.length)];
const hash = (n: number) => {
  const v = Math.sin(n * 127.1) * 43758.5453;
  return v - Math.floor(v);
};
const hydrantAt = (cell: number) => (cell !== 0 && hash(cell) < 0.4 ? cell * 230 + 40 + hash(cell + 9) * 150 : null);

function newNpc(x: number, score: number): Npc {
  const roll = Math.random();
  const hard = Math.min(score, 16) / 40; // more runners and joggers as you go
  const kind: Kind = roll < 0.2 ? "phone" : roll < 0.6 - hard ? "walker" : roll < 0.8 ? "jogger" : "runner";
  return {
    x, dir: Math.random() < 0.5 ? -1 : 1, kind, walk: Math.random() * 10,
    look: { shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hair: pick(HAIRS) },
    told: false, pinned: false, bolt: 0, turn: 1 + Math.random() * 3, say: "", sayT: 0,
  };
}

type Mode = "title" | "play" | "over";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef({ left: false, right: false, jump: false, act: false, shield: false, jumpHit: false, actHit: false });
  const [pinning, setPinning] = useState(false);
  const [mode, setMode] = useState<Mode>("title");
  useKeepAwake(mode === "play");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}

    const s = {
      mode: "title" as Mode, t: 0, time: ROUND, score: 0, overT: 0, newBest: false,
      p: { x: 0, y: GROUND, vy: 0, face: 1, walk: 0, lunge: 0, cool: 0, down: 0, stun: 0, pin: null as Npc | null, pinT: 0, tell: 0 },
      npcs: [] as Npc[], bits: [] as Bit[], arrows: [] as Arrow[], arrowT: 5, shielding: false, blocked: 0, flash: "", flashT: 0,
    };

    const start = () => {
      s.mode = "play"; s.time = ROUND; s.score = 0; s.newBest = false;
      Object.assign(s.p, { x: 0, y: GROUND, vy: 0, face: 1, lunge: 0, cool: 0, down: 0, stun: 0, pin: null, pinT: 0, tell: 0 });
      s.npcs = [newNpc(45, 0), newNpc(-60, 0), newNpc(100, 0)];
      s.npcs[0].kind = "phone";
      s.bits = [];
      s.arrows = []; s.arrowT = 5; s.blocked = 0;
      setMode("play");
      setPinning(false);
    };

    const release = () => {
      if (s.p.pin) s.p.pin.pinned = false;
      s.p.pin = null;
      setPinning(false);
    };

    const update = (dt: number) => {
      const k = keys.current;
      const jump = k.jumpHit;
      const act = k.actHit;
      k.jumpHit = false;
      k.actHit = false;
      s.t += dt;

      if (s.mode !== "play") {
        if (s.mode === "over") s.overT += dt;
        if ((act || jump) && (s.mode === "title" || s.overT > 1)) start();
        return;
      }

      const p = s.p;
      s.time -= dt;
      if (s.time <= 0) {
        s.time = 0; s.mode = "over"; s.overT = 0;
        release();
        if (s.score > best) {
          best = s.score; s.newBest = true;
          try { localStorage.setItem(BEST_KEY, String(best)); } catch {}
        }
        setMode("over");
        return;
      }
      p.cool = Math.max(0, p.cool - dt);
      s.flashT = Math.max(0, s.flashT - dt);
      s.shielding = k.shield && p.down <= 0 && p.lunge <= 0 && p.tell <= 0 && p.y >= GROUND;

      if (p.pin) {
        // Holding someone down: tell them, or they wriggle free.
        if (p.tell > 0) {
          p.tell -= dt;
          if (p.tell <= 0) {
            const n = p.pin;
            n.told = true; n.say = pick(REPLIES); n.sayT = 1.4; n.dir = Math.random() < 0.5 ? -1 : 1;
            s.score++;
            for (let i = 0; i < 6; i++) s.bits.push({ x: n.x - 2, y: GROUND - 14, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 30, t: 0.9, heart: true });
            release();
            p.x -= 10 * p.face; p.cool = 0.25;
          }
        } else {
          p.pinT -= dt;
          if (act) p.tell = 1.0;
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
          for (const n of s.npcs) {
            if (!n.told && !n.pinned && Math.abs(n.x - p.x) < 9 && p.y > GROUND - 16) {
              n.pinned = true; n.bolt = 0; n.sayT = 0;
              p.pin = n; p.pinT = 2.6; p.tell = 0; p.lunge = 0; p.x = n.x; p.y = GROUND; p.vy = 0;
              setPinning(true);
              for (let i = 0; i < 5; i++) s.bits.push({ x: n.x, y: GROUND - 1, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 20, t: 0.4, heart: false });
              break;
            }
          }
          if (!p.pin && p.lunge <= 0 && p.y >= GROUND) {
            p.down = 0.45; // missed: face-plant
            for (let i = 0; i < 4; i++) s.bits.push({ x: p.x + 6 * p.face, y: GROUND - 1, vx: (Math.random() - 0.5) * 50, vy: -15 - Math.random() * 15, t: 0.35, heart: false });
          }
        } else if (p.stun > 0) {
          p.stun -= dt;
        } else if (s.shielding) {
          // standing firm behind the shield
        } else {
          if (k.left) { vx = -55; p.face = -1; }
          if (k.right) { vx = 55; p.face = 1; }
          if (jump && p.y >= GROUND) p.vy = -165;
          if (act && p.cool <= 0) { p.lunge = 0.26; p.cool = 0.6; }
        }
        if (!p.pin) {
          const before = p.x;
          p.x += vx * dt;
          if (vx) p.walk += dt * 9;
          p.vy += 520 * dt;
          p.y = Math.min(GROUND, p.y + p.vy * dt);
          if (p.y >= GROUND) p.vy = 0;
          // Fire hydrants: jump them or trip.
          if (p.y > GROUND - 5 && p.lunge <= 0 && vx) {
            const cell = Math.floor(p.x / 230);
            for (const c of [cell - 1, cell, cell + 1]) {
              const hx = hydrantAt(c);
              if (hx !== null && Math.abs(p.x - hx) < 5 && Math.abs(before - hx) >= 5) {
                p.x = before; p.stun = 0.35; s.flash = "OOF!"; s.flashT = 0.5;
              }
            }
          }
        }
      }

      // Everyone else
      const mul = 1 + Math.min(s.score, 20) * 0.025;
      for (const n of s.npcs) {
        n.sayT = Math.max(0, n.sayT - dt);
        if (n.pinned) { n.walk += dt * 14; continue; }
        let v = 0;
        const dx = n.x - p.x;
        if (n.told) v = 9 * n.dir;
        else if (n.bolt > 0) { n.bolt -= dt; n.dir = dx >= 0 ? 1 : -1; v = 78 * n.dir; }
        else if (n.kind === "walker") v = 13 * n.dir * mul;
        else if (n.kind === "jogger") v = 36 * n.dir * mul;
        else if (n.kind === "runner") {
          if (Math.abs(dx) < 48) { n.dir = dx >= 0 ? 1 : -1; v = 50 * n.dir * mul; }
          else v = 8 * n.dir;
        }
        if (n.kind === "walker" || (n.kind === "runner" && Math.abs(dx) >= 48) || n.told) {
          n.turn -= dt;
          if (n.turn <= 0) { n.turn = 2 + Math.random() * 3; if (Math.random() < 0.5) n.dir *= -1; }
        }
        n.x += v * dt;
        if (v) n.walk += dt * Math.min(12, 4 + Math.abs(v) / 6);
      }
      s.npcs = s.npcs.filter((n) => n.pinned || Math.abs(n.x - p.x) < 300);
      while (s.npcs.filter((n) => !n.told).length < 5) {
        const side = Math.random() < 0.6 ? p.face : -p.face;
        s.npcs.push(newNpc(p.x + side * (112 + Math.random() * 90), s.score));
      }

      // Flaming arrows (Eph 6:16)
      s.arrowT -= dt;
      if (s.arrowT <= 0) {
        s.arrowT = Math.max(1.1, 3.4 - (ROUND - s.time) * 0.035) * (0.7 + Math.random() * 0.6);
        const tx = p.x + (Math.random() - 0.5) * 44 + (k.left ? -30 : k.right ? 30 : 0);
        const lean = Math.random() < 0.5 ? -1 : 1;
        const fall = 1.25;
        s.arrows.push({ x: tx - lean * 46, y: -8, vx: (lean * 46) / fall, vy: (GROUND + 8) / fall, tx });
      }
      for (const a of s.arrows) {
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (Math.abs(a.x - p.x) < 7 && a.y > p.y - 21 && a.y < p.y && p.down <= 0) {
          a.y = 999;
          if (s.shielding) {
            s.blocked++; s.flash = "FAITH!"; s.flashT = 0.7;
            for (let i = 0; i < 6; i++) s.bits.push({ x: p.x, y: p.y - 20, vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 30, t: 0.4, heart: false });
          } else {
            if (p.pin) { const n = p.pin; n.bolt = 3; release(); }
            p.down = 0.8; p.lunge = 0; p.vy = 0; p.y = GROUND; p.tell = 0;
            s.time = Math.max(0.1, s.time - 3); s.flash = "OUCH! -3"; s.flashT = 1;
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

    const draw = () => {
      const p = s.p;
      const cam = Math.round(p.x - W / 2);
      // sky
      const bands = ["#161a33", "#1f2547", "#2f2f5a", "#4d3a66", "#7c4a6a", "#b8665f", "#e09a62"];
      bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 10, W, 10); });
      ctx.fillStyle = "#e09a62"; ctx.fillRect(0, 70, W, 20);
      // stars and sun
      ctx.fillStyle = "#f4e9c9";
      for (let i = 0; i < 22; i++) ctx.fillRect(Math.floor(hash(i + 3) * W), Math.floor(hash(i + 71) * 26), 1, 1);
      ctx.fillStyle = "#ffd98a"; ctx.fillRect(138, 44, 16, 16);
      ctx.fillStyle = "#ffe9b5"; ctx.fillRect(140, 46, 12, 12);
      // far hills
      ctx.fillStyle = "#5a3f63";
      for (let x = 0; x < W; x += 4) {
        const wx = x + cam * 0.15;
        const hgt = 12 + Math.sin(wx / 37) * 6 + Math.sin(wx / 13) * 2;
        ctx.fillRect(x, GROUND - 14 - hgt, 4, hgt + 6);
      }
      // town
      const off = cam * 0.5;
      for (let c = Math.floor(off / 26) - 1; c <= Math.floor((off + W) / 26) + 1; c++) {
        const bx = Math.round(c * 26 - off);
        const bh = 18 + Math.floor(hash(c * 3.7) * 34);
        ctx.fillStyle = hash(c) < 0.5 ? "#2a2440" : "#332a4a";
        ctx.fillRect(bx, GROUND - 12 - bh, 23, bh);
        ctx.fillStyle = "#f2c66a";
        for (let wy = 0; wy < bh - 8; wy += 7) for (let wx = 0; wx < 3; wx++) {
          if (hash(c * 91 + wy * 7 + wx) < 0.45) ctx.fillRect(bx + 3 + wx * 6, GROUND - 9 - bh + wy, 3, 4);
        }
      }
      // pavement and road
      ctx.fillStyle = "#3b3550"; ctx.fillRect(0, GROUND - 12, W, 12);
      ctx.fillStyle = "#8f8a9c"; ctx.fillRect(0, GROUND, W, 12);
      ctx.fillStyle = "#b9b4c4"; ctx.fillRect(0, GROUND, W, 2);
      ctx.fillStyle = "#6f6a7d";
      for (let x = -(((cam % 24) + 24) % 24); x < W; x += 24) ctx.fillRect(x, GROUND + 2, 1, 10);
      ctx.fillStyle = "#26232f"; ctx.fillRect(0, GROUND + 12, W, H - GROUND - 12);
      ctx.fillStyle = "#d4b062";
      for (let x = -(((cam % 40) + 40) % 40); x < W; x += 40) ctx.fillRect(x, GROUND + 16, 14, 1);
      // hydrants
      for (let c = Math.floor(cam / 230) - 1; c <= Math.floor((cam + W) / 230) + 1; c++) {
        const hx = hydrantAt(c);
        if (hx === null) continue;
        const x = Math.round(hx - cam);
        ctx.fillStyle = "#c0392b"; ctx.fillRect(x - 2, GROUND - 7, 4, 7);
        ctx.fillRect(x - 3, GROUND - 5, 6, 2);
        ctx.fillStyle = "#e8604f"; ctx.fillRect(x - 1, GROUND - 8, 2, 1);
      }

      // people
      for (const n of s.npcs) {
        const x = n.x - cam;
        if (x < -20 || x > W + 20) continue;
        person(ctx, x, GROUND, false, n.look, { face: n.dir, step: Math.floor(n.walk) % 2 === 0, lying: n.pinned, happy: n.told });
        if (n.kind === "phone" && !n.told && !n.pinned) { ctx.fillStyle = "#dfe7f2"; ctx.fillRect(Math.round(x) + 3 * n.dir, GROUND - 13, 1, 2); }
        if (n.told) heart(ctx, x - 2, GROUND - 23 + Math.sin(s.t * 4 + n.x) * 1.5);
      }
      const px = p.x - cam;
      const disc: Look = { shirt: "", pants: "", hair: "", skin: "#d9a273" };
      if (p.pin) person(ctx, px, GROUND - 6 + (Math.floor(s.t * 8) % 2), true, disc, { face: p.face, step: false, reach: !s.shielding, shield: s.shielding });
      else if (p.down > 0) person(ctx, px, GROUND, true, disc, { face: p.face, step: false, lying: true });
      else person(ctx, px, p.y, true, disc, { face: p.face, step: Math.floor(p.walk) % 2 === 0, reach: p.lunge > 0, shield: s.shielding });

      for (const a of s.arrows) {
        const ax = a.x - cam;
        const len = Math.hypot(a.vx, a.vy);
        const ux = a.vx / len, uy = a.vy / len;
        if (Math.floor(s.t * 10) % 2 === 0) { ctx.fillStyle = "#ff6b4a"; ctx.fillRect(Math.round(a.tx - cam) - 3, GROUND, 6, 1); }
        ctx.fillStyle = "#3a2a1c";
        for (let i = 2; i < 9; i++) ctx.fillRect(Math.round(ax - ux * i), Math.round(a.y - uy * i), 1, 1);
        ctx.fillStyle = "#ff6b2a"; ctx.fillRect(Math.round(ax) - 1, Math.round(a.y) - 1, 3, 3);
        ctx.fillStyle = Math.floor(s.t * 16) % 2 ? "#ffd24a" : "#fff3b0"; ctx.fillRect(Math.round(ax), Math.round(a.y), 1, 1);
        ctx.fillStyle = "#ff9a3a"; ctx.fillRect(Math.round(ax - ux * 3), Math.round(a.y - uy * 3) - 1, 1, 1);
      }

      for (const b of s.bits) {
        if (b.heart) heart(ctx, b.x - cam, b.y);
        else { ctx.fillStyle = "#d8d2e0"; ctx.fillRect(Math.round(b.x - cam), Math.round(b.y), 2, 2); }
      }

      // speech
      for (const n of s.npcs) if (n.sayT > 0) bubble(ctx, n.say, n.x - cam, GROUND - 20);
      if (p.pin) {
        if (p.tell > 0) bubble(ctx, "JESUS LOVES YOU!", px, GROUND - 26);
        else if (Math.floor(s.t * 5) % 2 === 0) bubble(ctx, "TELL THEM!", px, GROUND - 26);
      }
      if (s.flashT > 0 && !(p.pin && p.tell > 0)) bubble(ctx, s.flash, px, p.y - (p.pin ? 40 : 24));

      // score and clock
      if (s.mode === "play") {
        const told = `TOLD ${s.score}`;
        drawText(ctx, told, 5, 5, "#0b0d14", 2); drawText(ctx, told, 4, 4, "#fff8e7", 2);
        const tm = `${Math.ceil(s.time)}`;
        const tw = textWidth(tm, 2);
        drawText(ctx, tm, W - tw - 3, 5, "#0b0d14", 2);
        drawText(ctx, tm, W - tw - 4, 4, s.time < 10 ? "#ff8f7a" : "#fff8e7", 2);
      } else {
        ctx.fillStyle = "rgba(11,13,20,0.62)"; ctx.fillRect(0, 0, W, H);
        if (s.mode === "title") {
          centerText(ctx, "GO AND TELL", 14, "#d4b062", 4);
          centerText(ctx, "CATCH THEM. PIN THEM.", 42, "#fff8e7");
          centerText(ctx, "TELL THEM JESUS LOVES THEM.", 51, "#fff8e7");
          centerText(ctx, "SHIELD UP WHEN ARROWS FALL.", 60, "#ff9a6a");
          if (best > 0) centerText(ctx, `BEST ${best}`, 72, "#d4b062");
          if (Math.floor(s.t * 2) % 2 === 0) centerText(ctx, "PRESS START", 86, "#fff8e7", 2);
        } else {
          centerText(ctx, "TIME!", 10, "#d4b062", 4);
          centerText(ctx, `YOU TOLD ${s.score}`, 40, "#fff8e7", 3);
          centerText(ctx, s.newBest ? "NEW BEST!" : `BEST ${best}`, 62, "#d4b062", 2);
          if (s.blocked > 0) centerText(ctx, `ARROWS BLOCKED ${s.blocked}`, 77, "#ff9a6a");
          if (s.overT > 1 && Math.floor(s.t * 2) % 2 === 0) centerText(ctx, "PRESS START TO GO AGAIN", 88, "#fff8e7");
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
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
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
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

  return (
    <div className="game">
      <canvas ref={canvasRef} width={W} height={H} className="game-screen" aria-label="Go and Tell game screen" />
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
      <p className="muted small" style={{ marginTop: 14 }}>
        Tackle someone, then tell them before they wriggle free. Hold Shield when flaming arrows fall (Ephesians 6:16); a hit costs 3 seconds. Jump the fire hydrants. You have 60 seconds.
      </p>
    </div>
  );
}
