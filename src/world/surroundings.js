import * as THREE from "three";
import { addPart, boxPart, cylPart, place, spherePart, torusPart, tubePart } from "./geometry.js";

function flagPart(store, size, color, x, y, z, ry) {
  const geometry = new THREE.BufferGeometry();
  const height = size * 1.5;
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([-size / 2, 0, 0, size / 2, 0, 0, 0, -height, 0]),
      3,
    ),
  );
  geometry.computeVertexNormals();
  geometry.applyMatrix4(place(x, y, z, 0, ry, 0));
  addPart(store, geometry, color);
}

function puddlePart(store, sx, sz, x, z, color) {
  const geometry = new THREE.CircleGeometry(1, 12);
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(sx, 1, sz);
  geometry.translate(x, 0.018, z);
  addPart(store, geometry, color, true);
}

const SHOP_WALLS = [0xc98f83, 0x8fb5b7, 0xd2ad7d, 0xa3b89b, 0xb5a7c9];
const SHOP_AWNINGS = [0xe37d67, 0xe9bd67, 0x67bdb5, 0xdf91aa, 0x8fba79];
const SHOP_WINDOWS = [0xffd48a, 0xffe4b5, 0xaee7e1, 0xffba75];

function buildShopRow(parts, glowList) {
  let index = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i += 1) {
      const z = -14 + i * 4;
      const height = [2.45, 2.9, 2.62, 3.15, 2.55, 2.78, 3.0, 2.48][(i + (side > 0 ? 2 : 0)) % 8];
      const x = side * 10.85;
      const front = side * 8.64;
      const wall = SHOP_WALLS[(i + (side > 0 ? 1 : 0)) % SHOP_WALLS.length];
      const awning = SHOP_AWNINGS[(i + (side > 0 ? 3 : 0)) % SHOP_AWNINGS.length];

      boxPart(parts.structure, 4.4, height, 3.72, wall, x, height / 2, z);
      boxPart(parts.structure, 4.54, 0.16, 3.86, 0x78818e, x, height + 0.08, z);
      boxPart(parts.structure, 4.48, 0.28, 3.8, 0x69717e, x, 0.14, z);
      boxPart(parts.structure, 0.08, 1.22, 0.82, 0x625763, front + side * 0.015, 0.73, z + 0.68);
      boxPart(parts.emissive, 0.04, 1.0, 0.58, 0xffc978, front - side * 0.01, 0.74, z + 0.68);

      for (const dz of [-0.78, 0.66]) {
        boxPart(parts.structure, 0.08, 0.68, 0.68, 0x6d6470, front - side * 0.02, 1.62, z + dz);
        boxPart(parts.emissive, 0.035, 0.5, 0.49, SHOP_WINDOWS[(i + (dz > 0 ? 1 : 0)) % SHOP_WINDOWS.length], front - side * 0.065, 1.63, z + dz);
        boxPart(parts.thin, 0.025, 0.5, 0.035, 0x6b5960, front - side * 0.085, 1.63, z + dz);
      }

      boxPart(parts.structure, 1.0, 0.08, 3.25, awning, side * 8.15, 1.68, z);
      boxPart(parts.structure, 0.04, 0.2, 3.25, awning, side * 7.64, 1.55, z);
      for (let k = 0; k < 8; k += 1) {
        boxPart(parts.structure, 0.1, 0.12, 0.32, k % 2 ? 0xffe0b1 : awning, side * 7.61, 1.43, z - 1.24 + k * 0.35);
      }
      boxPart(parts.structure, 0.07, 0.42, 1.82, 0x665d69, front - side * 0.03, 2.04, z - 0.42);
      boxPart(parts.emissive, 0.035, 0.28, 1.55, SHOP_WINDOWS[(i + 2) % SHOP_WINDOWS.length], front - side * 0.075, 2.04, z - 0.42);

      if (index % 2 === 0) {
        glowList.push({
          position: new THREE.Vector3(front - side * 0.28, 1.8, z),
          size: 5.2,
          base: 0.34,
          phase: index * 0.83,
          speed: 1.8,
        });
      }
      if (i % 3 === 0) {
        boxPart(parts.structure, 0.52, 0.38, 0.48, 0x707784, side * 8.35, height + 0.4, z - 0.9);
        cylPart(parts.structure, 0.06, 0.06, 0.35, 8, 0x4b4f58, side * 8.35, height + 0.78, z - 0.9);
      }
      if (i % 2 === 1) {
        cylPart(parts.structure, 0.34, 0.3, 0.64, 10, 0x536b67, side * 11.6, height + 0.45, z + 1.05);
        cylPart(parts.structure, 0.38, 0.38, 0.06, 10, 0x39474a, side * 11.6, height + 0.78, z + 1.05);
      }
      index += 1;
    }
  }

  for (const side of [-1, 1]) {
    for (let z = -15; z <= 15; z += 1.5) {
      boxPart(parts.thin, 2.45, 0.012, 0.025, 0x9caeb0, side * 7.1, 0.11, z);
    }
    for (const z of [-12, -4, 4, 12]) {
      boxPart(parts.structure, 0.62, 0.42, 0.62, 0x6c5542, side * 7.06, 0.27, z);
      spherePart(parts.structure, 0.38, z % 8 === 0 ? 0x5d8b57 : 0x49764b, side * 7.06, 0.65, z, 7);
    }
  }
}

// 开放小吃街的环境：路灯、花池、长椅、小树、自行车、垃圾桶。
// 规则：一律低矮细杆，不出现屋顶、墙体、大体积遮挡物。
export function buildSurroundings(parts, glowList) {
  buildShopRow(parts, glowList);
  for (const z of [-12, -6, 0, 6, 12]) {
    for (const x of [-3.15, 3.15]) {
      const inward = x < 0 ? 1 : -1;
      cylPart(parts.thin, 0.06, 0.08, 3.0, 8, 0x4a4f5e, x, 1.5, z);
      boxPart(parts.thin, 0.55, 0.06, 0.06, 0x4a4f5e, x + inward * 0.28, 2.95, z);
      boxPart(parts.emissive, 0.26, 0.1, 0.26, 0xffd79a, x + inward * 0.55, 2.9, z);
      glowList.push({
        position: new THREE.Vector3(x + inward * 0.55, 2.9, z),
        size: 5.6,
        base: 0.42,
        phase: z * 0.3 + x,
        speed: 2.2,
      });
    }
  }

  for (const z of [-12, -6, 0, 6, 12]) {
    for (const x of [-6.3, 6.3]) {
      boxPart(parts.structure, 1.15, 0.4, 1.15, 0x6a5a48, x, 0.2, z);
      boxPart(parts.structure, 1.0, 0.1, 1.0, 0x3a2f26, x, 0.45, z);
      spherePart(parts.structure, 0.42, z % 12 === 0 ? 0x76a179 : 0x68916f, x, 0.72, z, 7);
      spherePart(parts.structure, 0.1, 0xff9ec4, x - 0.22, 0.94, z + 0.14, 6);
      spherePart(parts.structure, 0.08, 0xffe08a, x + 0.18, 0.9, z - 0.12, 6);
      spherePart(parts.structure, 0.07, 0xf2f0ff, x + 0.06, 0.98, z + 0.24, 6);
    }
  }

  for (const [x, z, yaw] of [
    [-5.5, 4, 0],
    [5.5, -4, Math.PI],
    [-5.5, -9, 0],
  ]) {
    boxPart(parts.structure, 1.5, 0.09, 0.44, 0x8a6242, x, 0.5, z, 0, yaw, 0);
    for (const dx of [-0.6, 0.6]) {
      boxPart(parts.thin, 0.08, 0.5, 0.08, 0x4a4a52, x + dx, 0.25, z, 0, yaw, 0);
    }
  }

  for (const [x, z] of [
    [-8.4, -10],
    [8.4, 10],
    [-8.6, 6],
  ]) {
    cylPart(parts.structure, 0.12, 0.16, 1.7, 8, 0x5a4232, x, 0.85, z);
    spherePart(parts.structure, 0.8, 0x76a975, x, 1.95, z, 8);
    spherePart(parts.structure, 0.5, 0x8aba81, x + 0.5, 1.6, z + 0.3, 7);
  }

  for (const [x, z, flip] of [
    [-6.0, 9.5, 1],
    [6.0, -1.5, -1],
  ]) {
    torusPart(parts.structure, 0.3, 0.035, 0x2f2b38, x + 0.55 * flip, 0.32, z - 0.5, 0, Math.PI / 2, 0);
    torusPart(parts.structure, 0.3, 0.035, 0x2f2b38, x + 0.55 * flip, 0.32, z + 0.5, 0, Math.PI / 2, 0);
    boxPart(parts.thin, 0.08, 0.08, 1.1, 0x4a86c0, x + 0.55 * flip, 0.62, z);
    boxPart(parts.thin, 0.08, 0.5, 0.08, 0x4a86c0, x + 0.55 * flip + 0.4, 0.85, z - 0.45, 0.3, 0, 0);
    boxPart(parts.thin, 0.4, 0.06, 0.06, 0x2f2b38, x + 0.55 * flip + 0.42, 1.06, z - 0.45);
  }

  for (const [x, z, color] of [
    [-5.8, -2, 0x62766e],
    [5.8, 8, 0x62766e],
  ]) {
    cylPart(parts.structure, 0.26, 0.24, 0.78, 10, color, x, 0.39, z);
    cylPart(parts.structure, 0.3, 0.3, 0.06, 10, 0x2c3630, x, 0.81, z);
  }

  // 路面：中心虚线 + 两条人行横道
  for (let z = -13; z <= 13; z += 2.4) {
    boxPart(parts.thin, 0.12, 0.02, 1.1, 0xe8e2d0, 0, 0.03, z);
  }
  for (const z0 of [-9.5, 9.5]) {
    for (let i = 0; i < 6; i += 1) {
      boxPart(parts.thin, 6.4, 0.02, 0.28, 0xb5a68c, 0, 0.03, z0 - 1.5 + i * 0.6);
    }
  }

  // 水洼与井盖
  for (const [x, z, sx, sz] of [
    [-1.8, 5.5, 1.1, 0.6],
    [2.4, -3.5, 0.9, 0.5],
    [-2.6, -9, 1.3, 0.7],
    [1.2, 11, 0.8, 0.45],
  ]) {
    puddlePart(parts.pool, sx, sz, x, z, 0x6485a5);
  }
  for (const [x, z] of [
    [0.9, 2],
    [-1.4, -5.5],
    [2.1, 7.5],
  ]) {
    cylPart(parts.structure, 0.36, 0.36, 0.03, 12, 0x3a3f4d, x, 0.02, z);
    torusPart(parts.structure, 0.36, 0.03, 0x565c6b, x, 0.03, z, -Math.PI / 2);
  }

  // 立式灯箱
  for (const [x, z, tone] of [
    [-7.6, -3, 0x4ad2c4],
    [7.6, 5, 0xff7ab0],
    [-7.4, 9, 0xffd24a],
  ]) {
    boxPart(parts.structure, 0.5, 1.0, 0.16, 0x3a3f52, x, 0.5, z);
    boxPart(parts.emissive, 0.4, 0.84, 0.04, tone, x, 0.5, z - 0.1);
    glowList.push({
      position: new THREE.Vector3(x, 0.55, z - 0.2),
      size: 4,
      base: 0.34,
      phase: x + z,
      speed: 2.2,
    });
  }

  // 小踏板车
  for (const [x, z, yaw] of [
    [-6.6, -6.5, 0.3],
    [6.4, 2.5, -0.4],
  ]) {
    boxPart(parts.structure, 0.42, 0.16, 1.3, 0x4a8fd0, x, 0.45, z, 0, yaw, 0);
    boxPart(parts.structure, 0.34, 0.22, 0.5, 0x2f3542, x, 0.72, z - 0.15, 0, yaw, 0);
    boxPart(parts.thin, 0.06, 0.75, 0.06, 0x9aa0b2, x, 0.85, z + 0.55, 0.25, yaw, 0);
    boxPart(parts.thin, 0.5, 0.05, 0.05, 0x9aa0b2, x, 1.15, z + 0.6);
    torusPart(parts.structure, 0.22, 0.04, 0x2f2b38, x, 0.22, z + 0.55, 0, Math.PI / 2, 0);
    torusPart(parts.structure, 0.22, 0.04, 0x2f2b38, x, 0.22, z - 0.55, 0, Math.PI / 2, 0);
    boxPart(parts.emissive, 0.16, 0.12, 0.05, 0xffe6a8, x, 0.78, z + 0.72);
  }

  // 啤酒筐与纸箱
  for (const [x, z] of [
    [-6.9, 11.5],
    [6.6, -9.5],
  ]) {
    boxPart(parts.structure, 0.56, 0.34, 0.44, 0xd8543c, x, 0.17, z);
    for (let i = 0; i < 3; i += 1) {
      for (let k = 0; k < 2; k += 1) {
        cylPart(parts.structure, 0.06, 0.06, 0.28, 8, 0x4a7a4a, x - 0.16 + i * 0.16, 0.42, z - 0.1 + k * 0.2);
      }
    }
  }
  for (const [x, z, s] of [
    [-7.2, 2, 0.6],
    [7.1, -12, 0.5],
    [-6.8, -12.5, 0.55],
  ]) {
    boxPart(parts.structure, s, s * 0.7, s, 0xb08a5a, x, s * 0.35, z);
    boxPart(parts.structure, s * 0.9, s * 0.6, s * 0.9, 0xc39a68, x + 0.05, s, z + 0.05);
  }

  // 木桶
  for (const [x, z] of [
    [-6.2, -2],
    [6.2, -13.5],
  ]) {
    cylPart(parts.structure, 0.32, 0.3, 0.8, 10, 0x8a6242, x, 0.4, z);
    torusPart(parts.structure, 0.33, 0.03, 0x4a4a52, x, 0.55, z, Math.PI / 2);
    torusPart(parts.structure, 0.33, 0.03, 0x4a4a52, x, 0.25, z, Math.PI / 2);
  }
}
