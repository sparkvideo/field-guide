"use client";
// "Go and Tell": a small side-scroller in the style of an early PlayStation game, just for fun.
// You are a disciple. Walk left or right, tackle someone, then tell them Jesus loves them.
// Flaming arrows fall from the sky; raise the shield of faith to put them out (Eph 6:16).
// Everything is drawn in code in 3D by components/game3d.ts, so there are no image or model files and it works offline.

import { useEffect, useRef, useState } from "react";
import { useKeepAwake } from "./KeepAwake";
import { createStage, VIEW_W, VIEW_H, type Look, type Rig, type Stage } from "./game3d";

const OW = 960; // the text layer on top of the 3D picture
const OH = 540;
const S = 0.1; // game units to metres in the 3D scene
const GROUND = 88; // y of everyone's feet
const ROUND = 60; // seconds
const BEST_KEY = "fg-game-best";

const SHIRTS = ["#c0453a", "#3f7fbf", "#4f9d69", "#8a5fbf", "#d08a2e", "#3aa7a3", "#b84f86", "#6d7684"];
const PANTS = ["#2c3350", "#3b3b46", "#4a3728", "#1f3a3a"];
const SKINS = ["#f0c9a0", "#d9a273", "#a8744c", "#7a4f32"];
const HAIRS = ["#231a14", "#5b3a1e", "#c9a24b", "#8d8d93", "#a33c1f"];
const REPLIES = ["REALLY?", "THANK YOU!", "I NEEDED THAT", "TELL ME MORE", "OK! OK!", "HE DOES?", "WOW", "AMEN!", "ME?"];

type Kind = "walker" | "jogger" | "runner" | "phone";
type Npc = {
  x: number; dir: number; kind: Kind; look: Look; walk: number;
  told: boolean; pinned: boolean; bolt: number; turn: number; say: string; sayT: number;
  z: number; rig: Rig | null;
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
    z: -0.9 + Math.random() * 1.1, rig: null,
  };
}

type Mode = "title" | "play" | "over";

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLCanvasElement>(null);
  const [broken, setBroken] = useState(false);
  const keys = useRef({ left: false, right: false, jump: false, act: false, shield: false, jumpHit: false, actHit: false });
  const [pinning, setPinning] = useState(false);
  const [mode, setMode] = useState<Mode>("title");
  useKeepAwake(mode === "play");

  useEffect(() => {
    let stage: Stage;
    try {
      stage = createStage(canvasRef.current!);
    } catch {
      setBroken(true);
      return;
    }
    const hud = hudRef.current!.getContext("2d")!;

    // Tiny synth sounds, made on the spot so there are no audio files.
    let audio: AudioContext | null = null;
    const wake = () => {
      try {
        audio = audio ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (audio.state === "suspended") audio.resume();
      } catch {}
    };
    const tone = (freq: number, dur: number, type: OscillatorType = "square", delay = 0, vol = 0.06) => {
      if (!audio) return;
      const o = audio.createOscillator();
      const g = audio.createGain();
      const t0 = audio.currentTime + delay;
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
      end: () => [784, 659, 523].forEach((f, i) => tone(f, 0.22, "square", i * 0.14)),
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}

    const s = {
      mode: "title" as Mode, t: 0, time: ROUND, score: 0, overT: 0, newBest: false,
      p: { x: 0, y: GROUND, vy: 0, face: 1, walk: 0, lunge: 0, cool: 0, down: 0, stun: 0, pin: null as Npc | null, pinT: 0, tell: 0 },
      moving: false, npcs: [] as Npc[], bits: [] as Bit[], arrows: [] as Arrow[], arrowT: 5, shielding: false, blocked: 0, flash: "", flashT: 0,
    };

    const start = () => {
      s.mode = "play"; s.time = ROUND; s.score = 0; s.newBest = false;
      Object.assign(s.p, { x: 0, y: GROUND, vy: 0, face: 1, lunge: 0, cool: 0, down: 0, stun: 0, pin: null, pinT: 0, tell: 0 });
      for (const n of s.npcs) if (n.rig) stage.freeRig(n.rig);
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
        sfx.end();
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
            sfx.tell();
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
              sfx.pin();
              for (let i = 0; i < 5; i++) s.bits.push({ x: n.x, y: GROUND - 1, vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 20, t: 0.4, heart: false });
              break;
            }
          }
          if (!p.pin && p.lunge <= 0 && p.y >= GROUND) {
            p.down = 0.45; // missed: face-plant
            sfx.miss();
            for (let i = 0; i < 4; i++) s.bits.push({ x: p.x + 6 * p.face, y: GROUND - 1, vx: (Math.random() - 0.5) * 50, vy: -15 - Math.random() * 15, t: 0.35, heart: false });
          }
        } else if (p.stun > 0) {
          p.stun -= dt;
        } else if (s.shielding) {
          // standing firm behind the shield
        } else {
          if (k.left) { vx = -55; p.face = -1; }
          if (k.right) { vx = 55; p.face = 1; }
          if (jump && p.y >= GROUND) { p.vy = -165; sfx.jump(); }
          if (act && p.cool <= 0) { p.lunge = 0.26; p.cool = 0.6; }
        }
        if (!p.pin) {
          const before = p.x;
          p.x += vx * dt;
          s.moving = !!vx;
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
      s.npcs = s.npcs.filter((n) => {
        const keep = n.pinned || Math.abs(n.x - p.x) < 300;
        if (!keep && n.rig) { stage.freeRig(n.rig); n.rig = null; }
        return keep;
      });
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
            s.blocked++; s.flash = "FAITH!"; s.flashT = 0.7; sfx.block();
            for (let i = 0; i < 6; i++) s.bits.push({ x: p.x, y: p.y - 20, vx: (Math.random() - 0.5) * 70, vy: -20 - Math.random() * 30, t: 0.4, heart: false });
          } else {
            if (p.pin) { const n = p.pin; n.bolt = 3; release(); }
            p.down = 0.8; p.lunge = 0; p.vy = 0; p.y = GROUND; p.tell = 0;
            s.time = Math.max(0.1, s.time - 3); s.flash = "OUCH! -3"; s.flashT = 1; sfx.hit();
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

    // ----- text on top of the 3D picture: score, clock, speech -----
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
    const speech = (text: string, wx: number, wy: number) => {
      const [fx, fy] = stage.project(wx, wy, 0);
      hud.font = `900 26px ${face}`;
      const w = hud.measureText(text).width + 28;
      const x = Math.max(8, Math.min(OW - w - 8, fx * OW - w / 2));
      const y = Math.max(60, fy * OH - 46);
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
      stage.setCamera(cx);

      const hx: number[] = [];
      const cell = Math.floor(p.x / 230);
      for (const c of [cell - 1, cell, cell + 1]) {
        const h = hydrantAt(c);
        if (h !== null && Math.abs(h - p.x) < 150) hx.push(h * S);
      }
      stage.setHydrants(hx);

      for (const n of s.npcs) {
        if (!n.rig) n.rig = stage.takeRig(n.look);
        const still = n.kind === "phone" && !n.told && n.bolt <= 0;
        stage.pose(n.rig, {
          x: n.x * S, y: 0, z: n.pinned ? 0 : n.z, face: n.dir, phase: still ? 0 : n.walk * 1.2,
          mode: n.pinned ? "lie" : "stand", flail: n.pinned, happy: n.told, phone: still && !n.pinned, t: s.t,
        });
      }
      const py = (GROUND - p.y) * S;
      if (p.pin) stage.pose(stage.player, { x: cx, y: 0.36, z: 0.06, face: p.face, phase: 0, mode: "kneel", reach: !s.shielding, shield: s.shielding, t: s.t });
      else if (p.down > 0) stage.pose(stage.player, { x: cx, y: 0, z: 0, face: p.face, phase: 0, mode: "lie", t: s.t });
      else if (p.lunge > 0) stage.pose(stage.player, { x: cx, y: py, z: 0, face: p.face, phase: 0, mode: "dive", reach: true, t: s.t });
      else stage.pose(stage.player, { x: cx, y: py, z: 0, face: p.face, phase: s.moving ? p.walk * 1.2 : 0, mode: "stand", shield: s.shielding, t: s.t });

      stage.setArrows(s.arrows.map((a) => ({ x: a.x * S, y: (GROUND - a.y) * S, vx: a.vx, vy: -a.vy, tx: a.tx * S })), s.t);
      stage.setBits(s.bits.map((b) => ({ x: b.x * S, y: (GROUND - b.y) * S, heart: b.heart, t: b.t })));
      stage.render();

      hud.clearRect(0, 0, OW, OH);
      for (const n of s.npcs) if (n.sayT > 0) speech(n.say, n.x * S, 2.2);
      if (p.pin) {
        if (p.tell > 0) speech("JESUS LOVES YOU!", cx, 2.7);
        else if (Math.floor(s.t * 5) % 2 === 0) speech("TELL THEM!", cx, 2.7);
      }
      if (s.flashT > 0 && !(p.pin && p.tell > 0)) speech(s.flash, cx, py + (p.pin ? 3.6 : 2.9));

      if (s.mode === "play") {
        label(`TOLD ${s.score}`, 22, 16, 40, "#fff8e7");
        label(`${Math.ceil(s.time)}`, OW - 22, 16, 44, s.time < 10 ? "#ff8f7a" : "#fff8e7", "right");
      } else {
        hud.fillStyle = "rgba(11,13,20,0.6)";
        hud.fillRect(0, 0, OW, OH);
        const blink = Math.floor(s.t * 2) % 2 === 0;
        if (s.mode === "title") {
          label("GO AND TELL", OW / 2, 70, 104, "#d4b062", "center");
          label("Catch them. Pin them. Tell them Jesus loves them.", OW / 2, 226, 30, "#fff8e7", "center");
          label("Raise your shield when the arrows fall.", OW / 2, 270, 30, "#ff9a6a", "center");
          if (best > 0) label(`BEST ${best}`, OW / 2, 334, 34, "#d4b062", "center");
          if (blink) label("PRESS START", OW / 2, 420, 46, "#fff8e7", "center");
        } else {
          label("TIME!", OW / 2, 50, 104, "#d4b062", "center");
          label(`YOU TOLD ${s.score}`, OW / 2, 200, 66, "#fff8e7", "center");
          label(s.newBest ? "NEW BEST!" : `BEST ${best}`, OW / 2, 296, 40, "#d4b062", "center");
          if (s.blocked > 0) label(`ARROWS BLOCKED ${s.blocked}`, OW / 2, 356, 30, "#ff9a6a", "center");
          if (s.overT > 1 && blink) label("PRESS AGAIN TO PLAY", OW / 2, 430, 40, "#fff8e7", "center");
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
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      audio?.close().catch(() => {});
      stage.dispose();
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
      <p className="muted small" style={{ marginTop: 14 }}>
        Tackle someone, then tell them before they wriggle free. Hold Shield when flaming arrows fall (Ephesians 6:16); a hit costs 3 seconds. Jump the fire hydrants. You have 60 seconds.
      </p>
    </div>
  );
}
