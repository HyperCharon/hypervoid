/**
 * Quick desktop screenshot variant of _shot.mjs — scrolls to trigger reveal
 * animations, captures full-page. See _shot.mjs header for prerequisites
 * (HV_CHROMIUM, HV_BASE, local site-login disabled).
 *
 * Usage: node scripts/_shot2.mjs <tag> '[["name","/path"],...]'
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const EXEC = process.env.HV_CHROMIUM || "/home/charon/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome";
const BASE = process.env.HV_BASE || "http://localhost:3199";
const OUT = process.env.HV_OUT || "/tmp/hv-shots2"; mkdirSync(OUT, { recursive: true });
const tag = process.argv[2] || "w1";
const PAGES = process.argv.slice(3).length ? JSON.parse(process.argv[3]) : [["home","/"],["post","/posts/tailwind-design-system"]];
const browser = await chromium.launch({ executablePath: EXEC });
for (const theme of ["dark","light"]) {
  const ctx = await browser.newContext({ viewport:{width:1440,height:900}, colorScheme: theme });
  await ctx.addInitScript((t)=>{try{localStorage.setItem("theme",t);localStorage.setItem("hypervoid:guest","1");}catch{}}, theme);
  const page = await ctx.newPage();
  for (const [name,path] of PAGES) {
    try { await page.goto(BASE+path,{waitUntil:"networkidle",timeout:30000}); await page.waitForTimeout(1500);
      // scroll to trigger reveals
      await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await page.waitForTimeout(800);
      await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(600);
      const f=`${OUT}/${tag}-${name}-${theme}.png`; await page.screenshot({path:f,fullPage:true}); console.log("OK",f);
    } catch(e){ console.log("ERR",name,theme,e.message.split("\n")[0]); }
  }
  await ctx.close();
}
await browser.close(); console.log("DONE");
