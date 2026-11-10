// A very small markdown renderer: **bold**, *italic*, [links](…) and the ➕ "verify" badge.
import Link from "next/link";
import type { ReactNode } from "react";

function href(target: string): string {
  if (target === "#holy-spirit-play") return "/holy-spirit";
  return target;
}

export function Verify() {
  return (
    <span className="verify" title="Supplemental material. Verify before use.">
      <span aria-hidden="true">➕ </span>verify
    </span>
  );
}

export function Md({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let bold = false;
  let italic = false;
  let buf = "";
  let key = 0;
  const flush = () => {
    if (!buf) return;
    let node: ReactNode = buf;
    if (italic) node = <em>{node}</em>;
    if (bold) node = <strong>{node}</strong>;
    out.push(<span key={key++}>{node}</span>);
    buf = "";
  };
  for (let i = 0; i < text.length; i++) {
    if (text.startsWith("**", i)) {
      flush();
      bold = !bold;
      i++;
      continue;
    }
    const ch = text[i];
    if (ch === "*") {
      flush();
      italic = !italic;
      continue;
    }
    if (ch === "➕") {
      flush();
      out.push(<Verify key={key++} />);
      if (text[i + 1] === " ") i++;
      continue;
    }
    if (ch === "[") {
      const m = text.slice(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (m) {
        flush();
        out.push(
          <Link key={key++} href={href(m[2])} className="link">
            {m[1]}
          </Link>
        );
        i += m[0].length - 1;
        continue;
      }
    }
    if (ch === "\n") {
      flush();
      out.push(<br key={key++} />);
      continue;
    }
    buf += ch;
  }
  flush();
  return <>{out}</>;
}
