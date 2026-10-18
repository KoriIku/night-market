import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(
  join(
    process.env.PLAYWRIGHT_BUNDLE ??
      join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"),
    "noop.js",
  ),
);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 960, height: 900 } });
page.on("pageerror", (error) => console.log("pageerror:", error.message));
await page.goto("http://localhost:5173/", { waitUntil: "load" });
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
await page.click("#btn-start");
await page.click("#btn-enter");
await page.waitForTimeout(2000);
await page.waitForTimeout(1500);
await page.screenshot({ path: "shots/peek.png" });

const probes = await page.evaluate(() => ({
  a: window.__debug.probe(0.0, 0.25),
  b: window.__debug.probe(0.32, 0.5),
  c: window.__debug.probe(-0.3, 0.05),
}));
console.log(JSON.stringify(probes, null, 2));

const kids = await page.evaluate(() =>
  window.__debug.scene.children.map((child, index) => `${index}:${child.name || child.type}`),
);

async function regionMean() {
  await page.evaluate(() => window.__debug.requestRegion(-0.06, 0.2, 0.06, 0.3));
  await page.waitForTimeout(700);
  return page.evaluate(() => window.__debug.region());
}

await page.evaluate(() => window.__debug.scene.children.forEach((child) => (child.visible = true)));
console.log("all visible:", await regionMean());

for (let i = 0; i < kids.length; i += 1) {
  await page.evaluate((index) => {
    window.__debug.scene.children.forEach((child) => (child.visible = true));
    window.__debug.scene.children[index].visible = false;
  }, i);
  console.log(`without ${kids[i]}:`, await regionMean());
}

for (const name of ["signMesh", "thinMesh"]) {
  await page.evaluate((target) => {
    window.__debug.scene.getObjectByName("steamPoints").visible = true;
    window.__debug.scene.getObjectByName("glowPoints").visible = true;
    window.__debug.scene.getObjectByName("structureOutline").visible = true;
    window.__debug.scene.getObjectByName("structureMesh").visible = true;
    window.__debug.scene.getObjectByName("thinMesh").visible = true;
    window.__debug.scene.getObjectByName("emissiveMesh").visible = true;
    const sign = window.__debug.scene.getObjectByName("signMesh");
    if (sign) sign.visible = true;
    const hit = window.__debug.scene.getObjectByName(target);
    if (hit) hit.visible = false;
  }, name);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/peek-no-${name}.png` });
}
await browser.close();
console.log("ok");
