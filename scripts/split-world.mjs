import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("src/world.js", "utf8").split("\n");

const targets = {
  BASE_SIZE: "constants",
  CART_X: "constants",
  WALK_HALF: "constants",
  STREET_LONG: "constants",
  LANTERN_ROWS: "constants",
  PALETTE: "constants",
  place: "geometry",
  addPart: "geometry",
  boxPart: "geometry",
  cylPart: "geometry",
  spherePart: "geometry",
  planePart: "geometry",
  torusPart: "geometry",
  tubePart: "geometry",
  mergeParts: "geometry",
  makeSoftTexture: "textures",
  makeRingTexture: "textures",
  makePoolTexture: "textures",
  drawSignCell: "textures",
  makeSignAtlas: "textures",
  signPart: "textures",
  Steam: "effects",
  Glows: "effects",
  buildStall: "stall",
  buildBlock: "blocks",
  buildEndBlock: "blocks",
  buildStreet: "index",
};

const headers = {
  constants: "",
  geometry: 'import * as THREE from "three";\n',
  textures: 'import * as THREE from "three";\nimport { place } from "./geometry.js";\n',
  effects: 'import * as THREE from "three";\nimport { makeSoftTexture } from "./textures.js";\n',
  stall:
    'import * as THREE from "three";\nimport { CART_X, PALETTE } from "./constants.js";\nimport { boxPart, cylPart, planePart, spherePart, torusPart } from "./geometry.js";\n',
  blocks:
    'import * as THREE from "three";\nimport { boxPart, cylPart, planePart } from "./geometry.js";\n',
  index: [
    'import * as THREE from "three";',
    'import { STALLS } from "../data.js";',
    'import { createOutlineMaterial, createToonMaterial } from "../toon.js";',
    'import { BASE_SIZE, LANTERN_ROWS, PALETTE, STREET_LONG, WALK_HALF } from "./constants.js";',
    'import { boxPart, cylPart, mergeParts, planePart, spherePart, torusPart, tubePart } from "./geometry.js";',
    'import { makePoolTexture, makeRingTexture, makeSignAtlas, signPart } from "./textures.js";',
    'import { Glows, Steam } from "./effects.js";',
    'import { buildStall } from "./stall.js";',
    'import { buildBlock, buildEndBlock } from "./blocks.js";',
    "",
  ].join("\n"),
};

const blocks = [];
let current = null;
let depth = 0;
let inTemplate = false;

for (const line of source) {
  if (!current) {
    const match = line.match(/^(?:export\s+)?(?:const|function|class)\s+([A-Za-z_$][\w$]*)/);
    if (!match) continue;
    current = { name: match[1], lines: [] };
  }
  current.lines.push(line);
  const ticks = (line.match(/`/g) || []).length;
  if (ticks % 2 === 1) inTemplate = !inTemplate;
  if (!inTemplate) {
    depth += (line.match(/\{/g) || []).length;
    depth -= (line.match(/\}/g) || []).length;
  }
  const trimmed = line.trim();
  const finished = depth <= 0 && (trimmed.endsWith("}") || trimmed.endsWith(";"));
  if (finished) {
    blocks.push(current);
    current = null;
    depth = 0;
  }
}

const buckets = {};
for (const block of blocks) {
  const target = targets[block.name];
  if (!target) continue;
  buckets[target] ??= [];
  let text = block.lines.join("\n").replace(/\s+$/, "");
  if (target === "constants" && !text.startsWith("export")) {
    text = text.replace(/^const /, "export const ");
  }
  if (target !== "index" && target !== "constants" && !text.startsWith("export")) {
    text = `export ${text}`;
  }
  buckets[target].push(text);
}

mkdirSync("src/world", { recursive: true });
for (const [target, chunks] of Object.entries(buckets)) {
  const body = `${headers[target]}${chunks.join("\n\n")}\n`;
  writeFileSync(`src/world/${target}.js`, body, "utf8");
}

console.log(
  Object.entries(buckets)
    .map(([target, chunks]) => `${target}: ${chunks.length}`)
    .join(", "),
);
