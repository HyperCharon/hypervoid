// Mobile light-mode full-page captures (dev tooling). See _shot.mjs header.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const EXEC = process.env.HV_CHROMIUM || "/home/charon/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const BASE = process.env.HV_BASE || "http://localhost:3199";
const OUT = process.env.HV_OUT || "/tmp/hv-m";
mkdirSync(OUT, { recursive: true });
const tag = process.argv[2] || "m";
const PAGES = JSON.parse(process.argv[3] || '[["home","/"],["post","/posts/hypervoid-readme"],["guestbook","/guestbook"]]');
const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light", deviceScaleFactor: 2 });
await ctx.addInitScript(() => { try { localStorage.setItem("theme", "light"); localStorage.setItem("hypervoid:guest", "1"); } catch {} });
const page = await ctx.newPage();
for (const [name, path] of PAGES) {
  try {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(900);
    const f = `${OUT}/${tag}-${name}.png`;
    await page.screenshot({ path: f, fullPage: true });
    console.log("OK", f);
  } catch (e) { console.log("ERR", name, e.message.split("\n")[0]); }
}
await ctx.close();
await browser.close();
console.log("DONE");
