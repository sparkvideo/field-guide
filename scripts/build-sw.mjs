// Runs after "next build". Writes out/sw.js: the offline worker, with the list of every file in the app.
// A new build gets a new version number, which is how installed apps notice new content.

import fs from "fs";
import path from "path";
import crypto from "crypto";

const OUT = "out";
const files = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else files.push("/" + path.relative(OUT, full).split(path.sep).join("/"));
  }
};
walk(OUT);

const hash = (list) => {
  const h = crypto.createHash("sha1");
  for (const f of list.sort()) h.update(f).update(fs.readFileSync(path.join(OUT, f)));
  return h.digest("hex").slice(0, 12);
};

const skip = (f) => f === "/sw.js" || f.startsWith("/push/") || f.endsWith(".map");
const bible = files.filter((f) => f.startsWith("/bible/"));
const shell = files.filter((f) => !f.startsWith("/bible/") && !skip(f));

const sw = fs
  .readFileSync("scripts/sw-template.js", "utf8")
  .replace("__VERSION__", hash(shell))
  .replace("__BIBLE_VERSION__", hash(bible))
  .replace("__SHELL__", JSON.stringify(shell.map(encodeURI))) // encodeURI: "[group]" is requested as "%5Bgroup%5D"
  .replace("__BIBLE__", JSON.stringify(bible));
fs.writeFileSync(path.join(OUT, "sw.js"), sw);
console.log(`sw.js written: ${shell.length} app files, ${bible.length} Bible files`);
