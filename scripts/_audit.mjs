// Local UI audit: horizontal overflow + light-mode text contrast (dev tooling).
// See _shot.mjs header for prerequisites. Usage: node scripts/_audit.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const EXEC = process.env.HV_CHROMIUM || "/home/charon/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const BASE = process.env.HV_BASE || "http://localhost:3199";
const OUT = process.env.HV_OUT || "/tmp/hv-audit";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["home", "/"],
  ["posts", "/posts"],
  ["post", "/posts/hypervoid-readme"],
  ["tags", "/tags"],
  ["archive", "/archive"],
  ["about", "/about"],
  ["friends", "/friends"],
  ["guestbook", "/guestbook"],
  ["anime", "/anime"],
  ["music", "/music"],
  ["search", "/search"],
];
const WIDTHS = [390, 768, 1280]; // phone / tablet / desktop(>xl)

const audit = () => {
  const vw = window.innerWidth;
  const sig = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    if (cls) s += "." + cls;
    return s.slice(0, 90);
  };
  const parseColor = (str) => {
    const m = str && str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const over = (c, base = { r: 255, g: 255, b: 255 }) =>
    c.a >= 1 ? c : { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a), a: 1 };
  const lum = ({ r, g, b }) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => { const a = lum(fg), b = lum(bg); const hi = Math.max(a, b), lo = Math.min(a, b); return (hi + 0.05) / (lo + 0.05); };
  const effBg = (el) => {
    let e = el;
    while (e) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return { img: true };
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) return over(c);
      e = e.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  // ── overflow ──
  const docOver = document.documentElement.scrollWidth - vw;
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const o = r.right - vw;
    if (o > 2) offenders.push({ sel: sig(el), over: Math.round(o), w: Math.round(r.width), left: Math.round(r.left), pos: cs.position, ox: cs.overflowX, ws: cs.whiteSpace });
  }
  offenders.sort((a, b) => b.over - a.over);

  // ── contrast (worst text) ──
  const seen = new Set();
  const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (t.length < 2) continue;
    const el = n.parentElement;
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.15) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const fg0 = parseColor(cs.color);
    if (!fg0 || fg0.a < 0.15) continue;
    const bg = effBg(el);
    if (bg.img) continue; // gradient/image bg — unreliable, check visually
    const fg = over(fg0, bg);
    const ratio = contrast(fg, bg);
    const fs = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight) >= 700;
    const large = fs >= 24 || (fs >= 18.66 && bold);
    const thresh = large ? 3.0 : 4.5;
    if (ratio < thresh) {
      const key = sig(el) + "|" + ratio.toFixed(1);
      if (seen.has(key)) continue;
      seen.add(key);
      bad.push({ sel: sig(el), txt: t.slice(0, 22), ratio: +ratio.toFixed(2), need: thresh, fs: Math.round(fs), fg: `${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)}`, bg: `${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}` });
    }
  }
  bad.sort((a, b) => a.ratio - b.ratio);
  return { docOver, offenders: offenders.slice(0, 12), bad: bad.slice(0, 14) };
};

const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({ colorScheme: "light" });
await ctx.addInitScript(() => { try { localStorage.setItem("theme", "light"); localStorage.setItem("hypervoid:guest", "1"); } catch {} });
const page = await ctx.newPage();

for (const [name, path] of PAGES) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(700);
      const res = await page.evaluate(audit);
      const flag = res.docOver > 2 ? `⚠ SCROLL +${res.docOver}px` : "ok";
      console.log(`\n### ${name} @${w}  doc-overflow:${flag}`);
      if (res.offenders.length) {
        console.log("  OVERFLOW elements:");
        for (const o of res.offenders) console.log(`   +${o.over}px  ${o.sel}  [w${o.w} left${o.left} ${o.pos} ox:${o.ox} ws:${o.ws}]`);
      }
      if (w === 390 && res.bad.length) {
        console.log("  LOW-CONTRAST text (light):");
        for (const b of res.bad) console.log(`   ${b.ratio}/${b.need}  fs${b.fs}  fg(${b.fg}) bg(${b.bg})  "${b.txt}"  ${b.sel}`);
      }
    } catch (e) {
      console.log(`### ${name} @${w} ERR ${e.message.split("\n")[0]}`);
    }
  }
}
await ctx.close();
await browser.close();
console.log("\nDONE");
