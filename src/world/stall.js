import * as THREE from "three";
import { CART_X, PALETTE } from "./constants.js";
import { boxPart, cylPart, spherePart, torusPart } from "./geometry.js";

const CREAM = 0xffe7c4;
const INK = 0x5d5966;

function addLantern(parts, glowList, x, y, z, index, offset = 0) {
  boxPart(parts.thin, 0.025, 0.28, 0.025, 0x6f4b3a, x, y + 0.27, z);
  cylPart(parts.structure, 0.13, 0.1, 0.06, 10, 0xd6a34c, x, y + 0.14, z);
  cylPart(parts.structure, 0.16, 0.12, 0.3, 10, 0xcf3d2f, x, y, z);
  cylPart(parts.emissive, 0.13, 0.1, 0.24, 10, 0xffbd68, x, y, z);
  cylPart(parts.structure, 0.1, 0.13, 0.05, 10, 0xc78d3f, x, y - 0.16, z);
  boxPart(parts.structure, 0.04, 0.2, 0.04, 0x9d2f26, x, y - 0.29, z);
  glowList.push({
    position: new THREE.Vector3(x, y, z),
    size: 5.8,
    base: 0.55,
    phase: index * 1.7 + offset,
    speed: 2.1 + (index % 4) * 0.22,
  });
}

function addCrate(parts, x, y, z, color) {
  boxPart(parts.structure, 0.42, 0.26, 0.34, color, x, y, z);
  boxPart(parts.structure, 0.46, 0.035, 0.38, 0xe0c39b, x, y + 0.145, z);
  for (const dz of [-0.11, 0, 0.11]) {
    boxPart(parts.thin, 0.025, 0.23, 0.025, 0x8d6647, x, y, z + dz);
  }
}

function addCondiments(parts, x, y, z, toward) {
  for (let i = 0; i < 3; i += 1) {
    const tone = [0xd45a32, 0xe8c550, 0x7ca45a][i];
    cylPart(parts.structure, 0.055, 0.07, 0.15, 8, tone, x + toward * (0.2 + i * 0.12), y, z - 1.2);
    boxPart(parts.structure, 0.09, 0.035, 0.09, 0xd8cfbd, x + toward * (0.2 + i * 0.12), y + 0.09, z - 1.2);
  }
  boxPart(parts.structure, 0.16, 0.11, 0.32, 0xe6d8bf, x - toward * 0.25, y, z + 1.22);
  boxPart(parts.structure, 0.035, 0.34, 0.035, 0xb6b7bd, x + toward * 0.12, y + 0.18, z + 1.16, 0.3, 0, -0.18);
}

// 夜市摊 = 手推餐车：低矮、通透，俯视时能看到车上的食物与台面
export function buildStall(parts, stall, index, glowList, steamSources) {
  const cartX = stall.side === "left" ? -CART_X : CART_X;
  const toward = stall.side === "left" ? 1 : -1;
  const z = stall.z;
  const canopy = stall.canopy;
  const top = 1.12;
  const frontX = cartX + toward * 0.98;

  boxPart(parts.structure, 1.7, 0.8, 3.0, canopy, cartX, 0.62, z);
  boxPart(parts.structure, 1.74, 0.22, 2.72, INK, cartX - toward * 0.03, 0.36, z);
  for (let i = 0; i < 8; i += 1) {
    boxPart(parts.structure, 0.035, 0.5, 0.26, i % 2 ? 0xd98569 : 0xf0b18a, frontX - toward * 0.005, 0.62, z - 1.05 + i * 0.3);
  }
  boxPart(parts.structure, 1.92, 0.1, 3.22, PALETTE.counter, cartX, 1.07, z);
  boxPart(parts.structure, 1.96, 0.06, 3.28, 0xfff0d6, cartX, 1.135, z);
  boxPart(parts.structure, 1.5, 0.12, 2.7, PALETTE.cartBack, cartX, 0.2, z);
  boxPart(parts.thin, 0.06, 0.06, 3.15, 0xb98d60, frontX, 0.98, z);
  boxPart(parts.thin, 0.06, 0.06, 3.15, 0xb98d60, cartX - toward * 0.88, 0.98, z);

  for (const dz of [-1.15, 1.15]) {
    cylPart(parts.structure, 0.24, 0.24, 0.1, 10, PALETTE.wheel, cartX - 0.55, 0.24, z + dz, 0, 0, Math.PI / 2);
    cylPart(parts.structure, 0.24, 0.24, 0.1, 10, PALETTE.wheel, cartX + 0.55, 0.24, z + dz, 0, 0, Math.PI / 2);
    cylPart(parts.emissive, 0.075, 0.075, 0.11, 8, 0xe5c389, cartX + toward * 0.01, 0.24, z + dz, 0, 0, Math.PI / 2);
    boxPart(parts.thin, 0.08, 0.035, 0.42, 0xc9b28d, cartX, 0.24, z + dz);
    boxPart(parts.thin, 0.08, 0.42, 0.035, 0xc9b28d, cartX, 0.24, z + dz);
  }
  boxPart(parts.thin, 0.08, 0.08, 0.8, 0x4a4a52, cartX, 0.4, z - 1.85, -0.2);
  boxPart(parts.thin, 0.08, 0.5, 0.08, 0x8d8178, cartX, 0.66, z - 2.18, -0.32);
  boxPart(parts.thin, 0.62, 0.08, 0.1, 0x8d8178, cartX, 0.88, z - 2.34);

  // 半开放雨棚，只压住餐车后半段，保留俯视时对食物的视线。
  const canopyX = cartX - toward * 0.38;
  for (const dz of [-1.48, 1.48]) {
    for (const dx of [-0.72, 0.72]) {
      boxPart(parts.thin, 0.045, 1.08, 0.045, 0x958779, cartX + dx, 1.62, z + dz);
    }
  }
  for (let i = 0; i < 6; i += 1) {
    const stripeTone = i % 2 ? CREAM : canopy;
    boxPart(parts.structure, 0.27, 0.055, 3.08, stripeTone, canopyX - 0.68 + i * 0.27, 2.18, z);
  }
  for (let i = 0; i < 8; i += 1) {
    const stripeTone = i % 2 ? CREAM : canopy;
    boxPart(parts.structure, 0.035, 0.25, 0.37, stripeTone, canopyX + 0.84, 2.04, z - 1.29 + i * 0.37);
  }
  boxPart(parts.emissive, 0.055, 0.05, 2.78, 0xffd398, canopyX + 0.94, 2.1, z);
  boxPart(parts.emissive, 0.04, 0.04, 2.78, 0xffc476, canopyX - 0.78, 2.1, z);

  boxPart(parts.emissive, 0.2, 0.26, 0.2, 0xffcd8a, cartX + toward * 1.05, 1.9, z);
  glowList.push({
    position: new THREE.Vector3(cartX + toward * 1.05, 1.9, z),
    size: 7.2,
    base: 0.56,
    phase: index * 1.7,
    speed: 2.1 + (index % 3) * 0.4,
  });
  for (const dz of [-1.25, 1.25]) {
    addLantern(parts, glowList, frontX + toward * 0.02, 1.95, z + dz, index, dz);
  }

  boxPart(parts.structure, 0.06, 0.66, 0.46, 0x2f2b33, cartX + toward * 0.6, 0.33, z + 2.1, 0, 0, 0.14);
  boxPart(parts.structure, 0.3, 0.3, 0.3, PALETTE.cartBack, cartX - toward * 0.7, 0.16, z + 1.7);
  addCrate(parts, cartX - toward * 0.56, 0.31, z + 2.03, index % 2 ? 0xb54c38 : 0x4e7894);
  addCondiments(parts, cartX + toward * 0.38, top + 0.14, z, toward);

  const kind = stall.kind;
  if (kind === "griddle") {
    boxPart(parts.structure, 1.4, 0.1, 2.2, 0x353844, cartX + toward * 0.05, top + 0.05, z);
    boxPart(parts.emissive, 1.3, 0.03, 2.0, 0x9c3a12, cartX + toward * 0.05, top + 0.115, z);
    for (let i = 0; i < 4; i += 1) {
      boxPart(parts.structure, 0.34, 0.08, 0.16, i % 2 ? 0xe7c578 : 0xc06f42, cartX + toward * 0.05, top + 0.17, z - 0.8 + i * 0.5);
    }
    boxPart(parts.structure, 0.28, 0.12, 0.28, 0xe8e2d4, cartX + toward * 0.6, top + 0.08, z + 1.4);
    boxPart(parts.structure, 0.28, 0.12, 0.28, 0xd8d2c4, cartX + toward * 0.6, top + 0.2, z + 1.4);
    boxPart(parts.structure, 0.16, 0.18, 0.08, 0xded5c3, cartX + toward * 0.62, top + 0.35, z - 1.5, 0, 0, -0.25);
  } else if (kind === "grill") {
    boxPart(parts.structure, 0.8, 0.26, 2.4, 0x33343c, cartX + toward * 0.05, top + 0.13, z);
    boxPart(parts.emissive, 0.7, 0.06, 2.2, 0xff6a20, cartX + toward * 0.05, top + 0.27, z);
    for (let i = 0; i < 6; i += 1) {
      const sz = z - 1.0 + i * 0.4;
      boxPart(parts.structure, 0.9, 0.03, 0.05, 0xb59a72, cartX + toward * 0.05, top + 0.4, sz, 0, 0, 0.12);
      boxPart(parts.structure, 0.3, 0.09, 0.12, i % 2 ? 0x9c4326 : 0xbb6042, cartX + toward * 0.05, top + 0.45, sz);
    }
    boxPart(parts.structure, 0.6, 0.1, 0.4, 0x6b4a2f, cartX + toward * 0.55, top + 0.06, z + 1.4);
    for (let i = 0; i < 4; i += 1) {
      boxPart(parts.structure, 0.5, 0.03, 0.04, 0xb59a72, cartX + toward * 0.55, top + 0.14, z + 1.28 + i * 0.08);
    }
    for (let i = 0; i < 5; i += 1) {
      spherePart(parts.structure, 0.075, i % 2 ? 0x9f3f27 : 0xc46a3e, cartX + toward * 0.57, top + 0.36, z + 1.36 + i * 0.085, 6);
    }
  } else if (kind === "pot") {
    cylPart(parts.structure, 0.42, 0.4, 0.36, 14, 0x444854, cartX + toward * 0.15, top + 0.18, z);
    cylPart(parts.emissive, 0.36, 0.36, 0.03, 14, 0xe6d6ba, cartX + toward * 0.15, top + 0.37, z);
    for (let i = 0; i < 4; i += 1) {
      cylPart(parts.structure, 0.13, 0.1, 0.09, 10, 0xf1ead8, cartX + toward * 0.1, top + 0.05, z - 1.2 + i * 0.7);
    }
    for (let i = 0; i < 4; i += 1) {
      spherePart(parts.structure, 0.075, [0xf0d9a0, 0xcd5b45, 0xf1b14a, 0x6c4540][i], cartX + toward * 0.57, top + 0.3, z - 0.75 + i * 0.32, 6);
    }
  } else if (kind === "scale") {
    boxPart(parts.structure, 0.8, 0.06, 0.6, 0xc8ccd4, cartX + toward * 0.05, top + 0.03, z + 0.5);
    boxPart(parts.structure, 0.22, 0.14, 0.1, 0x353a44, cartX + toward * 0.05, top + 0.1, z + 0.95);
    boxPart(parts.structure, 0.7, 0.09, 0.5, 0x7a5736, cartX + toward * 0.05, top + 0.05, z - 0.55);
    boxPart(parts.structure, 0.2, 0.12, 0.16, 0x9c6636, cartX + toward * 0.05, top + 0.12, z - 0.7);
    boxPart(parts.structure, 0.24, 0.1, 0.18, 0xd8ae60, cartX + toward * 0.05, top + 0.12, z - 0.35);
    boxPart(parts.structure, 0.24, 0.1, 0.18, 0xb0503a, cartX + toward * 0.05, top + 0.12, z - 0.1);
    for (let i = 0; i < 6; i += 1) {
      spherePart(parts.structure, 0.06, i % 2 ? 0x8f4c2c : 0xc47942, cartX + toward * 0.58, top + 0.28, z - 1.35 + i * 0.16, 6);
    }
  } else if (kind === "drink") {
    for (let i = 0; i < 3; i += 1) {
      cylPart(parts.structure, 0.09, 0.07, 0.22, 10, 0xf6ecd2, cartX + toward * 0.05, top + 0.11, z - 1.0 + i * 0.5);
    }
    cylPart(parts.structure, 0.24, 0.22, 0.5, 12, 0xd8ac60, cartX + toward * 0.1, top + 0.25, z + 1.1);
    boxPart(parts.structure, 0.16, 0.12, 0.16, 0xe8d24a, cartX + toward * 0.05, top + 0.06, z + 0.2);
    boxPart(parts.structure, 0.6, 1.0, 0.5, 0x5a6478, cartX - toward * 0.5, 0.6, z + 1.5);
    boxPart(parts.emissive, 0.5, 0.62, 0.03, 0x9fd0ff, cartX - toward * 0.78, 0.72, z + 1.5);
    for (let i = 0; i < 6; i += 1) {
      cylPart(parts.structure, 0.06, 0.05, 0.2, 8, i % 2 ? 0xd8e68a : 0xf2cc57, cartX + toward * 0.54, top + 0.2, z - 1.25 + i * 0.24, 0, 0, 0.08);
    }
  } else if (kind === "fruit") {
    boxPart(parts.structure, 0.6, 0.18, 0.6, 0xd04444, cartX - 0.35, top + 0.09, z - 0.6);
    boxPart(parts.structure, 0.6, 0.18, 0.6, 0xe8b02e, cartX + 0.3, top + 0.09, z + 0.1);
    boxPart(parts.structure, 0.6, 0.18, 0.6, 0x54a03e, cartX - 0.2, top + 0.09, z + 0.9);
    boxPart(parts.structure, 0.9, 0.06, 0.7, 0xa07a4a, cartX + toward * 0.3, top + 0.03, z - 1.2);
    boxPart(parts.structure, 0.2, 0.4, 0.65, 0xb9bec6, cartX + toward * 0.5, top + 0.3, z - 1.4, 0, 0, 0.25);
    for (let i = 0; i < 10; i += 1) {
      const tone = [0xe44d48, 0xf2c84a, 0x67a746, 0xf08c3e][i % 4];
      spherePart(parts.structure, 0.065, tone, cartX + toward * (0.22 + (i % 3) * 0.13), top + 0.2, z - 0.94 + Math.floor(i / 3) * 0.17, 6);
    }
  } else if (kind === "game") {
    boxPart(parts.structure, 1.6, 0.1, 2.0, PALETTE.wood, cartX + toward * 0.05, top + 0.05, z);
    for (let i = 0; i < 5; i += 1) {
      cylPart(parts.structure, 0.06, 0.06, 0.26, 8, 0x547a44, cartX + toward * 0.05, top + 0.13, z - 0.8 + i * 0.4);
    }
    torusPart(parts.structure, 0.14, 0.018, 0xe8e8ee, cartX + toward * 0.5, top + 0.1, z + 0.5, -Math.PI / 2, 0.3);
    torusPart(parts.structure, 0.14, 0.018, 0xd8442f, cartX + toward * 0.5, top + 0.1, z + 0.2, -Math.PI / 2, 0.1);
    torusPart(parts.structure, 0.14, 0.018, 0x4a7ab0, cartX + toward * 0.5, top + 0.1, z - 0.15, -Math.PI / 2, 0.5);
    for (let i = 0; i < 5; i += 1) {
      boxPart(parts.structure, 0.2, 0.24, 0.16, [0xe8d24a, 0xd04444, 0x4a7ab0, 0x54a03e, 0xd8442f][i], cartX - 0.6 + i * 0.3, 1.55, z - 1.55);
    }
    for (let i = 0; i < 4; i += 1) {
      spherePart(parts.structure, 0.11, [0xf4d65c, 0x65bde0, 0xf08ca8, 0x93c65b][i], cartX + toward * 0.48, top + 0.23, z + 0.85 - i * 0.2, 7);
    }
  } else if (kind === "fry") {
    boxPart(parts.structure, 1.2, 0.16, 1.6, 0x353844, cartX + toward * 0.05, top + 0.08, z);
    boxPart(parts.emissive, 1.1, 0.02, 1.5, 0xb07018, cartX + toward * 0.05, top + 0.17, z);
    cylPart(parts.structure, 0.28, 0.26, 0.24, 12, 0x6a6e7a, cartX + toward * 0.05, top + 0.28, z + 1.0);
    boxPart(parts.structure, 0.6, 0.08, 0.4, 0x8a6242, cartX + toward * 0.55, top + 0.04, z - 1.3);
    for (let i = 0; i < 7; i += 1) {
      boxPart(parts.structure, 0.05, 0.34, 0.05, 0xd8bd7a, cartX + toward * 0.48, top + 0.32, z + 0.62 + i * 0.075, 0.22, 0, 0);
    }
  } else if (kind === "chestnut") {
    cylPart(parts.structure, 0.5, 0.42, 0.28, 14, 0x3d4048, cartX + toward * 0.1, top + 0.14, z);
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      spherePart(parts.structure, 0.06, 0x7a4426, cartX + toward * 0.1 + Math.cos(angle) * 0.24, top + 0.3, z + Math.sin(angle) * 0.24);
    }
    cylPart(parts.structure, 0.28, 0.24, 0.44, 10, 0x8a6a44, cartX + toward * 0.6, top + 0.22, z + 1.4);
  }

  const vendorX = cartX - toward * 0.85;
  boxPart(parts.structure, 0.34, 0.78, 0.24, 0x312f3a, vendorX, 1.05, z + 0.4);
  boxPart(parts.structure, 0.37, 0.16, 0.28, 0x4d414b, vendorX, 1.36, z + 0.4);
  boxPart(parts.structure, 0.035, 0.5, 0.28, canopy, vendorX - toward * 0.18, 1.08, z + 0.4);
  boxPart(parts.structure, 0.12, 0.16, 0.12, 0x27242c, vendorX, 1.29, z + 0.18, 0, 0, toward * 0.28);
  spherePart(parts.structure, 0.145, 0xe8c39c, vendorX, 1.55, z + 0.4, 8);
  boxPart(parts.structure, 0.17, 0.1, 0.24, 0x302832, vendorX, 1.66, z + 0.4);
  boxPart(parts.structure, 0.28, 0.055, 0.3, canopy, vendorX, 1.7, z + 0.4);
  boxPart(parts.structure, 0.03, 0.17, 0.17, 0x2b2830, vendorX + toward * 0.02, 1.53, z + 0.48);

  if (!["scale", "drink", "game", "fruit"].includes(kind)) {
    steamSources.push({
      position: new THREE.Vector3(cartX + toward * 0.05, 1.45, z),
      rate: kind === "chestnut" ? 3.5 : 6,
      warm: ["grill", "griddle", "fry"].includes(kind),
      acc: 0,
    });
  }

  return { cartX, toward, z, frontX };
}
