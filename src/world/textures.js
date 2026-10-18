import * as THREE from "three";
import { STALLS } from "../data.js";
import { place } from "./geometry.js";
export function makeSoftTexture(size = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.42, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export function makeRingTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, r * 0.34, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.62, "rgba(255,255,255,0)");
  g.addColorStop(0.82, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export function makePoolTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(255,214,156,0.64)");
  g.addColorStop(0.42, "rgba(255,164,86,0.24)");
  g.addColorStop(1, "rgba(255,130,60,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export function makeStreetTexture() {
  const width = 512;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, width, 0);
  base.addColorStop(0, "#d3dedf");
  base.addColorStop(0.18, "#e8eeea");
  base.addColorStop(0.5, "#dde8e7");
  base.addColorStop(0.82, "#e9efeb");
  base.addColorStop(1, "#cedadc");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  let seed = 93241;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 950; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const size = 1 + random() * 3;
    const dark = random() > 0.46;
    ctx.fillStyle = dark ? `rgba(61,77,88,${0.06 + random() * 0.12})` : `rgba(255,245,226,${0.03 + random() * 0.08})`;
    ctx.fillRect(x, y, size * (1 + random() * 2), size);
  }
  for (const x of [42, width - 42]) {
    ctx.fillStyle = "rgba(65,75,91,0.2)";
    ctx.fillRect(x - 6, 0, 12, height);
    ctx.fillStyle = "rgba(255,245,228,0.2)";
    ctx.fillRect(x + 6, 0, 3, height);
  }
  for (let y = 48; y < height; y += 96) {
    ctx.strokeStyle = "rgba(73,83,99,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + (random() - 0.5) * 8);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  return tex;
}

export function drawSignCell(ctx, cell, name, price, tone) {
  const { x, y, w, h } = cell;
  ctx.fillStyle = tone;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  const paper = ctx.createLinearGradient(x, y, x, y + h);
  paper.addColorStop(0, "#fff7e5");
  paper.addColorStop(0.58, "#f8e8ca");
  paper.addColorStop(1, "#eed7b4");
  ctx.fillStyle = paper;
  ctx.fillRect(x + 12, y + 12, w - 24, h - 24);
  ctx.fillStyle = "rgba(73,41,27,0.18)";
  ctx.fillRect(x + 12, y + 12, w - 24, 9);
  ctx.strokeStyle = "rgba(159,76,38,0.78)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 8.5, y + 8.5, w - 17, h - 17);
  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 13.5, y + 13.5, w - 27, h - 27);
  ctx.strokeStyle = "rgba(166,91,51,0.16)";
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 22 + i * 68, y + 17);
    ctx.lineTo(x + 58 + i * 68, y + h - 17);
    ctx.stroke();
  }
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3d2414";
  ctx.font = "bold 38px 'Microsoft YaHei','PingFang SC',sans-serif";
  ctx.shadowColor = "rgba(255,255,255,0.32)";
  ctx.shadowBlur = 2;
  ctx.textAlign = "left";
  ctx.fillText(name, x + 24, y + h / 2 + 1);
  if (price) {
    ctx.fillStyle = "#c04a1e";
    ctx.font = "bold 31px 'Microsoft YaHei','PingFang SC',sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(price, x + w - 24, y + h / 2 + 2);
  }
  ctx.shadowBlur = 0;
}

export function makeSignAtlas() {
  const cw = 320;
  const ch = 96;
  const cols = 5;
  const rows = 3;
  const canvas = document.createElement("canvas");
  canvas.width = cw * cols;
  canvas.height = ch * rows;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f5eee2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cells = [];
  STALLS.forEach((stall, i) => {
    const cell = { x: (i % cols) * cw, y: Math.floor(i / cols) * ch, w: cw, h: ch };
    cells.push(cell);
    drawSignCell(ctx, cell, stall.name, stall.sign, i % 3 === 0 ? "#e89a86" : i % 3 === 1 ? "#8fc6c4" : "#efc879");
  });
  const gate = { x: (10 % cols) * cw, y: Math.floor(10 / cols) * ch, w: cw, h: ch };
  const exit = { x: (11 % cols) * cw, y: Math.floor(11 / cols) * ch, w: cw, h: ch };
  drawSignCell(ctx, gate, "夜市", "", "#e89a86");
  drawSignCell(ctx, exit, "街口", "", "#8fc6c4");
  cells.push(gate, exit);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  return { texture, cells, width: canvas.width, height: canvas.height };
}

export function signPart(store, cell, atlas, w, h, x, y, z, ry) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    uv.setXY(i, (cell.x + u * cell.w) / atlas.width, 1 - (cell.y + (1 - v) * cell.h) / atlas.height);
  }
  g.applyMatrix4(place(x, y, z, 0, ry, 0));
  // mergeParts 以非索引顶点流处理，这里必须先展开索引，否则相邻平面会连成穿画面的长三角形。
  const flat = g.index ? g.toNonIndexed() : g;
  if (flat !== g) g.dispose();
  store.push(flat);
}

const NEON_TONES = [
  { bg: "#e98a76", ink: "#5b2c28" },
  { bg: "#f0ce77", ink: "#57451e" },
  { bg: "#72c6bf", ink: "#20514e" },
  { bg: "#e99bb1", ink: "#5b2b3a" },
  { bg: "#9ac986", ink: "#31502d" },
  { bg: "#f7eddd", ink: "#584738" },
  { bg: "#b5a5de", ink: "#433861" },
  { bg: "#f5a476", ink: "#5c3424" },
  { bg: "#f3d970", ink: "#514319" },
  { bg: "#88c1e2", ink: "#254e65" },
];

// 竖版大招牌：一个字一行，远远就能看清，像夜市里的灯箱竖牌。
export function makeVerticalSignAtlas() {
  const cw = 176;
  const ch = 352;
  const cols = 4;
  const rows = 3;
  const canvas = document.createElement("canvas");
  canvas.width = cw * cols;
  canvas.height = ch * rows;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#5c5059";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cells = [];
  STALLS.forEach((stall, i) => {
    const cell = { x: (i % cols) * cw, y: Math.floor(i / cols) * ch, w: cw, h: ch };
    cells.push(cell);
    const tone = NEON_TONES[i % NEON_TONES.length];
    ctx.fillStyle = "#5c5059";
    ctx.fillRect(cell.x + 2, cell.y + 2, cw - 4, ch - 4);
    ctx.fillStyle = tone.bg;
    ctx.fillRect(cell.x + 10, cell.y + 10, cw - 20, ch - 20);
    const sheen = ctx.createLinearGradient(cell.x, cell.y, cell.x + cw, cell.y + ch);
    sheen.addColorStop(0, "rgba(255,255,255,0.26)");
    sheen.addColorStop(0.55, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(255,248,228,0.18)");
    ctx.fillStyle = sheen;
    ctx.fillRect(cell.x + 10, cell.y + 10, cw - 20, ch - 20);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    for (let line = 0; line < 5; line += 1) {
      ctx.fillRect(cell.x + 18, cell.y + 56 + line * 55, cw - 36, 2);
    }
    ctx.strokeStyle = "rgba(255,250,238,0.94)";
    ctx.lineWidth = 3;
    ctx.strokeRect(cell.x + 14, cell.y + 14, cw - 28, ch - 28);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 9;
    ctx.strokeRect(cell.x + 6, cell.y + 6, cw - 12, ch - 12);
    ctx.fillStyle = "rgba(255,250,237,0.8)";
    ctx.fillRect(cell.x + 18, cell.y + ch - 63, cw - 36, 34);
    ctx.fillStyle = "rgba(74,56,48,0.94)";
    ctx.font = "bold 21px 'Microsoft YaHei','PingFang SC',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stall.sign, cell.x + cw / 2, cell.y + ch - 46);

    const chars = [...stall.name];
    const fontSize = chars.length >= 4 ? 58 : 72;
    const step = Math.min(76, (ch - 106) / Math.max(1, chars.length));
    const startY = cell.y + 115 - ((chars.length - 1) * step) / 2 + 30;
    ctx.fillStyle = tone.ink;
    ctx.font = `bold ${fontSize}px 'Microsoft YaHei','PingFang SC',sans-serif`;
    ctx.shadowColor = "rgba(255,255,255,0.55)";
    ctx.shadowBlur = 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chars.forEach((char, k) => {
      ctx.fillText(char, cell.x + cw / 2, startY + k * step);
    });
    ctx.shadowBlur = 0;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return { texture, cells, width: canvas.width, height: canvas.height };
}
