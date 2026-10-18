import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BUNDLE =
  process.env.PLAYWRIGHT_BUNDLE ??
  join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(join(BUNDLE, "noop.js"));
const { chromium } = require("playwright");

const EDGE =
  process.env.EDGE_PATH ?? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.URL || "http://localhost:5173/";

mkdirSync("shots", { recursive: true });

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
  ],
});

const report = {};

async function attachLogs(page, tag) {
  page.on("pageerror", (error) => console.log(`[${tag}] pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") console.log(`[${tag}] console: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) console.log(`[${tag}] http ${response.status()} ${response.url()}`);
  });
}

async function sample(page) {
  await page.evaluate(() => window.__debug.requestSample());
  for (let i = 0; i < 30; i += 1) {
    const value = await page.evaluate(() => window.__debug.sample());
    if (value) return value;
    await page.waitForTimeout(150);
  }
  return page.evaluate(() => window.__debug.sample());
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();
await attachLogs(page, "desktop");
await page.goto(BASE, { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
await page.waitForTimeout(700);
await page.screenshot({ path: "shots/01-start.png" });

await page.click("#btn-start");
await page.click("#btn-enter");
await page.waitForTimeout(1200);
await page.screenshot({ path: "shots/02-street.png" });
await page.evaluate(() => window.__debug.setView({ yaw: -0.53, pitch: 0.61, dist: 10.6, distTarget: 10.6 }));
await page.waitForTimeout(1200);
await page.screenshot({ path: "shots/09-sign-closeup.png" });
await page.evaluate(() => window.__debug.setView({ yaw: -0.679, pitch: 0.705, dist: 14.8, distTarget: 14.8 }));
await page.waitForTimeout(800);
const ringPoint = await page.evaluate(() => window.__debug.screenForStall("kaochuan"));
await page.mouse.click(ringPoint.x, ringPoint.y);
await page
  .waitForFunction(
    () => !document.getElementById("panel-stall").classList.contains("hidden"),
    null,
    { timeout: 10000 },
  )
  .catch(() => {});
report.ringClickOpen = await page.evaluate(
  () => !document.getElementById("panel-stall").classList.contains("hidden"),
);
await page.screenshot({ path: "shots/11-ring-trigger.png" });
await page.evaluate(() => window.__debug.restart());
await page.waitForTimeout(400);
report.desktopSample = await sample(page);
report.desktopInfo = await page.evaluate(() => window.__debug.info());
report.desktopFps = await page.evaluate(() => window.__debug.measureFps(2000));
report.desktopCharacter = await page.evaluate(() => window.__debug.character());

await page.evaluate(() => window.__debug.gotoStall("kaochuan"));
await page.waitForTimeout(1000);
report.characterAtStall = await page.evaluate(() => window.__debug.character());
await page.screenshot({ path: "shots/03-stall.png" });

await page.click("#panel-stall .item");
await page.waitForTimeout(220);
await page.screenshot({ path: "shots/04-buy-feedback.png" });
await page.waitForTimeout(1680);
await page.screenshot({ path: "shots/04-buy.png" });

await page.evaluate(() => window.__debug.buy("kaochuan", "beef"));
await page.evaluate(() => window.__debug.buy("bingfen", "classic"));
await page.evaluate(() => window.__debug.buy("bingfen", "fruit"));
await page.evaluate(() => window.__debug.buy("ningmengcha", "medium"));
await page.evaluate(() => window.__debug.buy("ningmengcha", "grape"));
await page.evaluate(() => window.__debug.buy("ningmengcha", "boba"));
await page.evaluate(() => window.__debug.buy("guoqie", "small"));
await page.evaluate(() => window.__debug.buy("choudoufu", "soup"));
await page.waitForTimeout(400);
await page.click("#btn-home");
await page.waitForTimeout(300);
await page.fill("#guess-input", "100");
await page.screenshot({ path: "shots/05-guess.png" });
await page.click("#guess-ok");
await page.waitForTimeout(2200);
await page.screenshot({ path: "shots/06-receipt.png" });
report.desktopState = await page.evaluate(() => window.__debug.state);

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobile.newPage();
await attachLogs(mobilePage, "mobile");
await mobilePage.goto(BASE, { waitUntil: "load" });
await mobilePage.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
await mobilePage.click("#btn-start");
await mobilePage.click("#btn-enter");
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ path: "shots/07-mobile-street.png" });
await mobilePage.evaluate(() => window.__debug.gotoStall("luwei"));
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ path: "shots/08-mobile-stall.png" });
await mobilePage.evaluate(() => window.__debug.gotoStall("kaochuan"));
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ path: "shots/10-mobile-grill.png" });
report.mobileSample = await sample(mobilePage);
report.mobileFps = await mobilePage.evaluate(() => window.__debug.measureFps(2000));
report.mobileInfo = await mobilePage.evaluate(() => window.__debug.info());

console.log(JSON.stringify(report, null, 2));

await browser.close();
