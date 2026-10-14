// Full-page screenshots of the running dev server. Usage: npm run dev (in another shell), then npm run screenshots
import { chromium } from "playwright-core";
const base = process.env.BASE || "http://localhost:8080";
const browser = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome" });
const pages = { home: "/", project: "/projects/example-project-one/" };
const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
for (const [pn, path] of Object.entries(pages)) for (const [sn, vp] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: sn === "mobile" ? 2 : 1 });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.screenshot({ path: `screenshots/${pn}-${sn}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log("done");
