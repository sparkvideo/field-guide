// Makes the app icons from public/icons/icon.svg.  Run: npm run icons
import sharp from "sharp";
import fs from "fs";

const svg = fs.readFileSync("public/icons/icon.svg");
const make = (size, file) => sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/icons/${file}`);
await make(180, "apple-touch-icon.png");
await make(192, "icon-192.png");
await make(512, "icon-512.png");
await make(512, "icon-maskable-512.png");
await make(48, "favicon.png");
console.log("Icons written to public/icons/");
