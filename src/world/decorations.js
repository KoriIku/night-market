import * as THREE from "three";
import { LANTERN_ROWS } from "./constants.js";
import { boxPart, cylPart, spherePart, tubePart } from "./geometry.js";

const CABLE = 0x626672;
const LANTERN_RED = 0xe06f60;
const LANTERN_GOLD = 0xf5c979;

function crossStreetCable(parts, z, row) {
  const left = new THREE.Vector3(-4.08, 3.05, z);
  const right = new THREE.Vector3(4.08, 3.05, z);
  let previous = left;
  for (let i = 1; i <= 14; i += 1) {
    const t = i / 14;
    const point = new THREE.Vector3(
      THREE.MathUtils.lerp(left.x, right.x, t),
      3.05 - Math.sin(t * Math.PI) * (0.28 + (row % 2) * 0.05),
      z,
    );
    tubePart(parts.thin, previous, point, 0.012, CABLE, 4);
    previous = point;
  }
}

function stringLantern(parts, glowList, x, y, z, row, index, red) {
  boxPart(parts.thin, 0.014, 0.2, 0.014, CABLE, x, y - 0.1, z);
  if (red) {
    cylPart(parts.structure, 0.045, 0.055, 0.035, 8, LANTERN_GOLD, x, y - 0.21, z);
    cylPart(parts.structure, 0.17, 0.13, 0.32, 10, LANTERN_RED, x, y - 0.39, z);
    cylPart(parts.emissive, 0.142, 0.108, 0.27, 10, 0xffb45e, x, y - 0.39, z);
    cylPart(parts.structure, 0.055, 0.075, 0.055, 8, LANTERN_GOLD, x, y - 0.56, z);
    boxPart(parts.thin, 0.018, 0.16, 0.018, 0x8b3027, x, y - 0.66, z);
  } else {
    spherePart(parts.emissive, 0.065, 0xffd595, x, y - 0.23, z, 6);
    cylPart(parts.structure, 0.086, 0.086, 0.05, 7, 0xe5bc74, x, y - 0.18, z);
  }
  glowList.push({
    position: new THREE.Vector3(x, y - (red ? 0.38 : 0.23), z),
    size: red ? 7.4 : 4.2,
    base: red ? 0.58 : 0.46,
    phase: row * 1.37 + index * 0.73,
    speed: 1.9 + ((row + index) % 4) * 0.18,
  });
}

function festivalPennant(parts, x, y, z, color, flip) {
  boxPart(parts.thin, 0.018, 0.16, 0.018, CABLE, x, y - 0.08, z);
  boxPart(parts.structure, 0.42, 0.28, 0.022, color, x, y - 0.29, z, 0, 0, flip ? -0.09 : 0.09);
  boxPart(parts.structure, 0.24, 0.16, 0.024, 0xffe4b2, x, y - 0.31, z - 0.001, 0, 0, flip ? -0.09 : 0.09);
}

export function buildStreetFestoon(parts, glowList) {
  const pennantTones = [0xe88370, 0xefc66c, 0x6fc0b8, 0xe59ab0];
  LANTERN_ROWS.forEach((z, row) => {
    crossStreetCable(parts, z, row);
    for (const x of [-4.08, 4.08]) {
      cylPart(parts.thin, 0.045, 0.065, 3.22, 8, 0x66717b, x, 1.61, z);
      cylPart(parts.structure, 0.1, 0.1, 0.08, 8, 0xc6a37a, x, 3.2, z);
      cylPart(parts.emissive, 0.075, 0.075, 0.12, 8, 0xffd18a, x, 3.31, z);
    }

    for (let i = 0; i < 7; i += 1) {
      const x = -3.6 + i * 1.2;
      const cableY = 3.05 - Math.sin(((x + 4.08) / 8.16) * Math.PI) * (0.28 + (row % 2) * 0.05);
      const red = i % 2 === 0;
      stringLantern(parts, glowList, x, cableY, z, row, i, red);
    }
    for (const [x, color, flip] of [
      [-2.4, pennantTones[row % pennantTones.length], 0],
      [2.4, pennantTones[(row + 2) % pennantTones.length], 1],
    ]) {
      const cableY = 3.05 - Math.sin(((x + 4.08) / 8.16) * Math.PI) * (0.28 + (row % 2) * 0.05);
      festivalPennant(parts, x, cableY, z, color, flip);
    }
  });
}

