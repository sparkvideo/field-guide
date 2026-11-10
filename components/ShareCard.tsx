"use client";
// Turns an answer into a picture you can text to someone.

import { useState } from "react";

type Props = { group: string; theySay: string; youSay: string; verses: string[]; askBack?: string };

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*➕]/g, "").replace(/\s+/g, " ").trim();

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > width && current) {
      lines.push(current);
      current = word;
    } else current = test;
  }
  if (current) lines.push(current);
  return lines;
}

function draw({ group, theySay, youSay, verses, askBack }: Props): HTMLCanvasElement {
  const W = 1080;
  const PAD = 84;
  const FONT = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const blocks: { text: string; font: string; color: string; gap: number; line: number }[] = [
    { text: `${group}: they say`, font: `600 30px ${FONT}`, color: "#d4b062", gap: 0, line: 44 },
    { text: plain(theySay), font: `700 52px ${FONT}`, color: "#efe9dc", gap: 14, line: 68 },
    { text: "You say", font: `600 30px ${FONT}`, color: "#d4b062", gap: 64, line: 44 },
    { text: plain(youSay), font: `500 44px ${FONT}`, color: "#efe9dc", gap: 14, line: 62 },
    ...(verses.length ? [{ text: verses.join("  ·  "), font: `600 36px ${FONT}`, color: "#d4b062", gap: 40, line: 52 }] : []),
    ...(askBack
      ? [
          { text: "Ask them back", font: `600 30px ${FONT}`, color: "#d4b062", gap: 64, line: 44 },
          { text: plain(askBack), font: `italic 600 44px ${FONT}`, color: "#efe9dc", gap: 14, line: 62 },
        ]
      : []),
  ];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  // measure first, so the picture is exactly as tall as it needs to be
  let height = PAD;
  const laid = blocks.map((b) => {
    ctx.font = b.font;
    const lines = wrap(ctx, b.text, W - PAD * 2);
    height += b.gap + lines.length * b.line;
    return { ...b, lines };
  });
  height += 150;
  canvas.width = W;
  canvas.height = Math.max(height, 1080);

  ctx.fillStyle = "#0e1210";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "top";
  let y = PAD;
  for (const b of laid) {
    y += b.gap;
    ctx.font = b.font;
    ctx.fillStyle = b.color;
    for (const l of b.lines) {
      ctx.fillText(l, PAD, y);
      y += b.line;
    }
  }
  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = "#a3a293";
  ctx.fillText("Field Guide: Apologetics", PAD, canvas.height - PAD - 20);
  return canvas;
}

export function ShareCard(props: Props) {
  const [busy, setBusy] = useState(false);
  const share = async () => {
    setBusy(true);
    try {
      const canvas = draw(props);
      const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/png"));
      if (!blob) return;
      const file = new File([blob], "field-guide-answer.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] });
      else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
      }
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className="link small inline-flex min-h-[48px] cursor-pointer items-center border-0 bg-transparent p-0" onClick={share} disabled={busy}>
      Share as a picture
    </button>
  );
}
