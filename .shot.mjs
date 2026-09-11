import { chromium } from "@playwright/test";
const [html, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 990 } });
await p.goto("file://" + html, { waitUntil: "load" });
const secs = await p.locator("section.pagina").all();
for (const [i, s] of secs.entries()) await s.screenshot({ path: `${out}/p${i + 1}.png`, scale: "css" });
await b.close();
