// Makes every app icon from public/icons/icon-source.png (a square image, 1024px or larger).
// To change the icon: replace that file, run "npm run icons", and push.
import sharp from "sharp";

const make = (size, file) => sharp("public/icons/icon-source.png").resize(size, size, { fit: "cover" }).png().toFile(`public/icons/${file}`);
await make(180, "apple-touch-icon.png");
await make(192, "icon-192.png");
await make(512, "icon-512.png");
await make(512, "icon-maskable-512.png");
await make(96, "mark.png"); // the small emblem in the app's header
await make(48, "favicon.png");
await make(32, "favicon-32.png");
console.log("Icons written to public/icons/");
