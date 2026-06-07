/**
 * Local visual-regression screenshots (dev tooling — not used in prod or CI).
 * Captures each page in dark+light × desktop+mobile into $HV_OUT (/tmp/hv-shots).
 *
 * Prerequisites:
 *   1. A Chromium binary. playwright-core bundles none — set HV_CHROMIUM, or
 *      install one with `npx playwright install chromium`. The default below is
 *      the local ms-playwright cache.
 *   2. A running dev server (default http://localhost:3199 — override HV_BASE).
 *   3. Site-wide login disabled locally, otherwise every page redirects to
 *      /sign-in. The guest localStorage flag set below is client-side only and
 *      does NOT satisfy the server-side proxy.ts gate — never commit an auth
 *      bypass to proxy.ts to work around this.
 *
 * Usage: node scripts/_shot.mjs
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const EXEC = process.env.HV_CHROMIUM || "/home/charon/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const BASE = process.env.HV_BASE || "http://localhost:3199";
const OUT = process.env.HV_OUT || "/tmp/hv-shots";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["home", "/"],
  ["posts", "/posts"],
  ["post", "/posts/random"],
  ["tags", "/tags"],
  ["archive", "/archive"],
  ["about", "/about"],
  ["friends", "/friends"],
  ["guestbook", "/guestbook"],
  ["anime", "/anime"],
  ["music", "/music"],
  ["search", "/search"],
];

const THEMES = ["dark", "light"];
const VIEWPORTS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];

const browser = await chromium.launch({ executablePath: EXEC });
for (const theme of THEMES) {
  for (const [vp, w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      colorScheme: theme,
    });
    // set theme via next-themes localStorage key + guest flag
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
        localStorage.setItem("hypervoid:guest", "1");
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    for (const [name, path] of PAGES) {
      // mobile only needs a subset to keep it fast
      if (vp === "mobile" && !["home", "posts", "post", "about", "anime"].includes(name)) continue;
      try {
        await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1200);
        const file = `${OUT}/${name}-${theme}-${vp}.png`;
        await page.screenshot({ path: file, fullPage: vp === "desktop" });
        console.log("OK", file);
      } catch (e) {
        console.log("ERR", name, theme, vp, e.message.split("\n")[0]);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log("DONE");
