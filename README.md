# Apologetics Field Guide

A phone-first app that turns `content/field_guide_apologetics.md` into a fast field guide:
pick who you're talking to, choose **Make the case** or **Answer an objection**, and get the
opener, the verses in order, and what to say if they push back. It installs to the iPhone home
screen and works with no signal.

There is no server and no database. Everything is plain files.

## What's in the folder

| Folder / file | What it is |
|---|---|
| `content/field_guide_apologetics.md` | **Your guide. The only place content is written.** |
| `content/guide.json` | The guide, sorted into boxes for the app (made by `npm run parse`) |
| `content/lsb-verses.json` | LSB text for the verses the guide cites. **You fill this in.** |
| `content/lsb-todo.md` | Which LSB verses are still empty |
| `content/parse-report.md` | What the parser found, and anything it couldn't place |
| `data/bsb-source.json` | The whole Berean Standard Bible (public domain) |
| `public/bible/` | The Bible split into one small file per book, plus search files |
| `app/`, `components/`, `lib/` | The screens and the code behind them |
| `lib/config.ts` | Settings you may want to edit (copyright notice, "Open in LSB" link) |
| `scripts/` | The parser and build helpers |

## Running it on your computer

You need [Node.js](https://nodejs.org) (version 20 or newer). Then, in a terminal inside this folder:

```
npm install
npm run dev
```

Open http://localhost:3000. (Offline mode and install only work in the built version: `npm run build`, then `npm start`.)

## How to fill in the LSB verses

**Easiest way:** open `tools/lsb-helper.html` in your browser (double-click it). For each reference, tap **Open in LSB**,
copy the verse, paste it in the box. It saves as you go. When finished, tap **Download lsb-verses.json** and put that file
in the `content` folder, replacing the old one. Then push to GitHub.

**By hand instead:**

1. Open `content/lsb-todo.md` to see which references are still empty.
2. Open `content/lsb-verses.json`. Each verse looks like this:
   ```json
   { "ref": "Isaiah 44:6", "key": "isaiah.44.6", "text": "" }
   ```
3. Paste the LSB text between the quotes after `"text":`. For a range (like Acts 5:3–4), paste the verses one after another.
   If the verse itself contains a double quote `"`, type it as `\"`.
4. Save, then push to GitHub (see "Updating content"). Done.

Until a verse is filled in, the app shows the BSB text with a small **BSB** label. A filled verse shows a small **LSB** label.
Running `npm run parse` again never erases text you've filled in.

The LSB is copyrighted. The notice the publisher requires is on the app's About screen and lives in `lib/config.ts`.
Their permission page (LSBible.org → "Permission to Quote the LSB") sets limits on how many verses may be quoted
without written permission; read it once before sharing the app widely.

## Updating content

1. Edit `content/field_guide_apologetics.md`.
2. Run `npm run parse`. Read the report it prints (also saved to `content/parse-report.md`).
   "Lines the parser could not place" should be **0**.
3. Push to GitHub. Vercel rebuilds and deploys on its own in about a minute.
4. Installed apps pick up the new content the next time they're opened with a connection.

Keep the markdown in the same shape it has now (`#### PLAY 1: …`, `- **Opener:**`, `- **Chain:**`,
`- **If they say →**`, `- **Closer:**`, and the defense tables). The parser reads those labels.

## Deploying to Vercel (step by step, no coding)

1. Create a free account at [github.com](https://github.com) and install [GitHub Desktop](https://desktop.github.com).
2. In GitHub Desktop: **File → Add Local Repository**, choose this folder. It will offer to **create a repository**; say yes.
   Then click **Publish repository** (keeping it private is fine).
3. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
4. Find the repository in the list and click **Import**, then **Deploy**. Don't change any settings; `vercel.json` already tells Vercel what to do.
5. After about a minute Vercel shows your link (something like `field-guide-xyz.vercel.app`). That's the link you text to the group.
   You can add your own domain later under **Settings → Domains**.

From then on, every time you push a change in GitHub Desktop (**Commit**, then **Push**), Vercel redeploys.

## How it works (short version)

- **Screens:** Home → group → play or objection. Three levels, plus one search bar.
- **Search:** typing a reference ("jn 1 1") shows the verse; otherwise it lists guide answers first, then Bible verses containing the words.
- **Verses:** tap a verse chip for the text; "Read chapter" opens it in the reader; "Open in LSB" opens BibleGateway in LSB.
- **Offline:** on first open, a background worker saves every page; then it saves the Bible (about 2.5 MB of download).
- **Updates:** each deploy gets a new version number. Installed apps notice it on the next open and swap in the new files.
- **Pins:** saved on the phone only.
- **Privacy:** no accounts, analytics, tracking or outside services.

## Extras

- **Show them:** tap a verse, then "Show them", for the verse alone in large type to hand across.
- **Train** (on Home): one question a day with a streak, plus a drill for each group. In a drill you answer from memory,
  flip the card, and mark "Got it" or "Missed it"; missed cards come back. Cards are the objections and "If they say"
  lines already in the guide, so new content shows up in training automatically. Each drill also has a **Quiz** side:
  pick the right answer out of three, then see the verses.
- **Share as a picture:** at the bottom of any objection, to text the answer as an image.
- **Pin a verse:** the ☆ in the verse sheet adds it to Pinned on Home.
- **Recent:** the last play or objection opened appears on Home.
- **Screen stays on** while a play, objection or practice card is open (on phones that support it).
- **Plays with no "Opener" line** show their first step under "Start here". Add `- **Opener:** …` to the play in the
  markdown and it becomes "Say this" instead.

## Changing the icon

Replace `public/icons/icon.svg`, run `npm run icons`, and push.
