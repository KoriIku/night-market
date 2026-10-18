import * as THREE from "three";
import { STALLS } from "../data.js";
import { createOutlineMaterial, createToonMaterial } from "../toon.js";
import { BASE_SIZE, LANTERN_ROWS, PALETTE, STREET_LONG, WALK_HALF } from "./constants.js";
import { boxPart, cylPart, mergeParts, planePart, spherePart, torusPart, tubePart } from "./geometry.js";
import {
  makePoolTexture,
  makeRingTexture,
  makeSignAtlas,
  makeStreetTexture,
  makeVerticalSignAtlas,
  signPart,
} from "./textures.js";
import { Glows, Steam } from "./effects.js";
import { buildStreetFestoon } from "./decorations.js";
import { buildStall } from "./stall.js";
import { buildSurroundings } from "./surroundings.js";
export function buildStreet(scene) {
  const parts = { structure: [], thin: [], emissive: [], pool: [], sign: [], vsign: [] };
  const atlas = makeSignAtlas();
  const verticalAtlas = makeVerticalSignAtlas();
  const stallRecords = [];
  const steamSources = [];
  const glowList = [];

  boxPart(parts.structure, BASE_SIZE, 0.8, BASE_SIZE, 0x52627b, 0, -0.4, 0);
  for (const [w, d, x, z] of [
    [BASE_SIZE + 0.7, 0.6, 0, BASE_SIZE / 2],
    [BASE_SIZE + 0.7, 0.6, 0, -BASE_SIZE / 2],
    [0.6, BASE_SIZE + 0.7, -BASE_SIZE / 2, 0],
    [0.6, BASE_SIZE + 0.7, BASE_SIZE / 2, 0],
  ]) {
    boxPart(parts.structure, w, 0.14, d, 0x927965, x, 0.07, z);
  }

  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, STREET_LONG),
    createToonMaterial({ tint: 0x8ca8b8, map: makeStreetTexture() }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.y = 0.012;
  scene.add(street);

  boxPart(parts.structure, 2.4, 0.16, STREET_LONG, PALETTE.curb, -4.2, 0.08, 0);
  boxPart(parts.structure, 2.4, 0.16, STREET_LONG, PALETTE.curb, 4.2, 0.08, 0);
  boxPart(parts.structure, 10, 0.1, STREET_LONG, 0x73868d, -10.9, 0.05, 0);
  boxPart(parts.structure, 10, 0.1, STREET_LONG, 0x73868d, 10.9, 0.05, 0);
  boxPart(parts.thin, 0.1, 0.02, STREET_LONG - 4, 0xd8d2c0, -3.6, 0.03, 0);
  boxPart(parts.thin, 0.1, 0.02, STREET_LONG - 4, 0xd8d2c0, 3.6, 0.03, 0);

  STALLS.forEach((stall, index) => {
    const info = buildStall(parts, stall, index, glowList, steamSources);
    const signYaw = info.toward > 0 ? 0.34 : -0.34;
    const signX = info.cartX + info.toward * 1.62;
    const signZ = info.z + 1.32;
    const signNormalX = Math.sin(signYaw);
    const signNormalZ = Math.cos(signYaw);
    const signSurface = 0.075;
    boxPart(parts.structure, 1.34, 2.04, 0.12, 0x5b4b50, signX, 1.27, signZ, 0, signYaw, 0);
    boxPart(parts.structure, 1.22, 0.1, 0.18, 0x8d7160, signX, 2.34, signZ, 0, signYaw, 0);
    signPart(
      parts.vsign,
      verticalAtlas.cells[index],
      verticalAtlas,
      1.18,
      1.9,
      signX + signNormalX * signSurface,
      1.27,
      signZ + signNormalZ * signSurface,
      signYaw,
    );
    signPart(
      parts.vsign,
      verticalAtlas.cells[index],
      verticalAtlas,
      1.18,
      1.9,
      signX - signNormalX * signSurface,
      1.27,
      signZ - signNormalZ * signSurface,
      signYaw + Math.PI,
    );
    cylPart(parts.thin, 0.035, 0.045, 0.56, 6, 0x75606a, signX, 0.28, signZ);
    planePart(
      parts.pool,
      4.6,
      3.0,
      index % 3 === 0 ? 0xff9a5d : index % 3 === 1 ? 0xffc274 : 0xffaa68,
      info.frontX + info.toward * 0.35,
      0.037,
      stall.z,
      -Math.PI / 2,
      0,
      0,
      true,
    );
    planePart(
      parts.pool,
      1.15,
      3.5,
      index % 2 ? 0x66c8c0 : 0xff9f71,
      signX + info.toward * 0.14,
      0.04,
      signZ - 1.0,
      -Math.PI / 2,
      0,
      0,
      true,
    );
    const zoneX = stall.side === "left" ? -2.4 : 2.4;
    torusPart(parts.emissive, 1.28, 0.045, 0xffc56f, zoneX, 0.064, stall.z, -Math.PI / 2, 0, 0);
    torusPart(parts.emissive, 1.12, 0.018, 0xffe1a8, zoneX, 0.064, stall.z, -Math.PI / 2, 0, 0);
    glowList.push({
      position: new THREE.Vector3(signX + signNormalX * 0.1, 1.28, signZ + signNormalZ * 0.1),
      size: 7,
      base: 0.46,
      phase: index * 1.1,
      speed: 2,
    });
    stallRecords.push({
      ...stall,
      anchor: new THREE.Vector3(stall.side === "left" ? -2.4 : 2.4, 0, stall.z),
      position: new THREE.Vector3(info.cartX, 0, stall.z),
    });
  });

  buildSurroundings(parts, glowList);
  buildStreetFestoon(parts, glowList);

  for (let i = 0; i < LANTERN_ROWS.length; i += 1) {
    if (i % 2 !== 0) continue;
    planePart(
      parts.pool,
      7.2,
      2.2,
      i % 4 === 0 ? 0xffad69 : 0x72b7b5,
      0,
      0.041,
      LANTERN_ROWS[i],
      -Math.PI / 2,
      0,
      0,
      true,
    );
  }

  for (const [x, z, color] of [
    [-2.3, 6.5, 0x44543f],
    [2.35, -3.5, 0x44543f],
    [-2.35, -10.5, 0x3f4a56],
  ]) {
    cylPart(parts.structure, 0.28, 0.26, 0.86, 10, color, x, 0.43, z);
    cylPart(parts.structure, 0.32, 0.32, 0.07, 10, 0x2c3630, x, 0.88, z);
  }

  for (const [x, z] of [
    [-3.3, 9],
    [3.3, 2],
    [-3.3, -7],
    [3.3, -13],
  ]) {
    boxPart(parts.structure, 0.54, 0.54, 0.54, PALETTE.wood, x, 0.27, z);
    boxPart(parts.structure, 0.46, 0.46, 0.46, 0xb89058, x + 0.05, 0.78, z + 0.05);
  }

  for (const [x, z] of [
    [-2.7, 13],
    [2.7, -8],
  ]) {
    boxPart(parts.structure, 1.2, 0.08, 1.2, 0xa07a4a, x, 0.76, z);
    for (const [dx, dz] of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) {
      cylPart(parts.structure, 0.17, 0.15, 0.46, 8, dx === 0 ? 0xd8543c : 0x4a7ab0, x + dx, 0.23, z + dz);
    }
  }

  for (const [x, z] of [
    [3.2, 11.5],
    [-3.4, -13.5],
  ]) {
    boxPart(parts.structure, 0.9, 1.9, 0.7, 0x4a5468, x, 0.95, z);
    boxPart(parts.emissive, 0.76, 1.5, 0.06, 0xffd9a0, x, 0.98, z - 0.38);
    for (let i = 0; i < 3; i += 1) {
      boxPart(parts.emissive, 0.6, 0.16, 0.04, 0xe8e0d0, x, 1.45 - i * 0.34, z - 0.42);
    }
  }

  for (const [x, z, tone] of [
    [-2.9, 2.5, 0x54a06a],
    [2.9, 7.5, 0xd8543c],
    [-2.9, -4.5, 0x4a86c0],
  ]) {
    cylPart(parts.structure, 0.24, 0.2, 0.34, 10, 0x8a5a3a, x, 0.17, z);
    spherePart(parts.structure, 0.3, tone, x, 0.55, z, 7);
  }

  const figures = [
    [-2.25, 8.5, 0x3f4456, 1],
    [2.2, -6.5, 0x54413c, 0.95],
    [-2.2, -12, 0x3c4a44, 1.05],
    [2.25, 3.5, 0x4a3f56, 0.98],
  ];
  for (const [x, z, color, scale] of figures) {
    boxPart(parts.structure, 0.36 * scale, 0.9 * scale, 0.24 * scale, color, x, 0.95 * scale, z);
    boxPart(parts.structure, 0.26 * scale, 0.26 * scale, 0.24 * scale, 0x2a2622, x, 1.52 * scale, z);
  }

  for (const [x, z, cell, yaw] of [
    [-5.4, 14.8, 10, 0],
    [5.4, -14.8, 11, Math.PI],
  ]) {
    const nx = Math.sin(yaw);
    const nz = Math.cos(yaw);
    cylPart(parts.thin, 0.07, 0.09, 2.75, 8, 0x68727b, x, 1.38, z);
    boxPart(parts.structure, 2.02, 0.69, 0.1, 0x625862, x, 2.24, z, 0, yaw, 0);
    signPart(parts.sign, atlas.cells[cell], atlas, 1.9, 0.57, x + nx * 0.065, 2.24, z + nz * 0.065, yaw);
    signPart(parts.sign, atlas.cells[cell], atlas, 1.9, 0.57, x - nx * 0.065, 2.24, z - nz * 0.065, yaw + Math.PI);
    glowList.push({
      position: new THREE.Vector3(x + nx * 0.1, 2.24, z + nz * 0.1),
      size: 5,
      base: 0.4,
      phase: z * 0.2,
      speed: 1.9,
    });
  }

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(140, 18, 10),
    new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(0x2d4c78) },
        uBottom: { value: new THREE.Color(0xa58c92) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uBottom;
        varying vec3 vPos;
        void main() {
          float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(0.32, 0.85, h)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  scene.add(sky);

  const structureGeometry = mergeParts(parts.structure);
  const structureMesh = new THREE.Mesh(
    structureGeometry,
    createToonMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  );
  const structureOutline = new THREE.Mesh(structureGeometry, createOutlineMaterial(0.85));
  structureOutline.name = "structureOutline";
  structureMesh.name = "structureMesh";
  const thinMesh = new THREE.Mesh(
    mergeParts(parts.thin),
    createToonMaterial({ vertexColors: true }),
  );
  thinMesh.name = "thinMesh";
  const emissiveMesh = new THREE.Mesh(
    mergeParts(parts.emissive),
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  );
  emissiveMesh.name = "emissiveMesh";
  const poolTexture = makePoolTexture();
  const poolMesh = new THREE.Mesh(
    mergeParts(parts.pool, true),
    new THREE.MeshBasicMaterial({
      map: poolTexture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  poolMesh.name = "poolMesh";
  poolMesh.renderOrder = 2;
  const ringTexture = makeRingTexture();
  const signMesh = new THREE.Mesh(
    mergeParts(parts.sign, true),
    new THREE.MeshBasicMaterial({ map: atlas.texture, side: THREE.DoubleSide }),
  );
  signMesh.name = "signMesh";
  const vsignMesh = new THREE.Mesh(
    mergeParts(parts.vsign, true),
    new THREE.MeshBasicMaterial({ map: verticalAtlas.texture, side: THREE.DoubleSide }),
  );
  vsignMesh.name = "vsignMesh";

  scene.add(structureMesh, structureOutline, thinMesh, emissiveMesh, poolMesh, signMesh, vsignMesh);

  const steam = new Steam(scene);
  const glows = new Glows(scene, glowList);

  const revealGroup = new THREE.Group();
  revealGroup.visible = false;
  scene.add(revealGroup);

  return {
    stalls: stallRecords,
    walkHalf: WALK_HALF,
    bounds: { zMin: -13.2, zMax: 13.2 },
    baseSize: BASE_SIZE,
    update(dt, focus, time) {
      steam.update(dt, focus, steamSources);
      glows.update(time);
    },
    reveal(path, stops) {
      while (revealGroup.children.length) {
        const child = revealGroup.children.pop();
        child.geometry?.dispose();
        child.material?.dispose();
      }
      if (path.length > 1) {
        const geo = new THREE.BufferGeometry().setFromPoints(
          path.map((p) => new THREE.Vector3(p.x, 0.08, p.z)),
        );
        revealGroup.add(
          new THREE.Line(
            geo,
            new THREE.LineBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0.8 }),
          ),
        );
      }
      if (stops.length) {
        const geo = new THREE.BufferGeometry().setFromPoints(
          stops.map((p) => new THREE.Vector3(p.x, 0.07, p.z)),
        );
        revealGroup.add(
          new THREE.Points(
            geo,
            new THREE.PointsMaterial({
              size: 1.4,
              map: ringTexture,
              color: 0xffb066,
              transparent: true,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
          ),
        );
      }
      revealGroup.visible = true;
    },
    resetReveal() {
      revealGroup.visible = false;
    },
  };
}
