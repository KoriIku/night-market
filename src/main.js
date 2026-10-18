import * as THREE from "three";
import { STALLS, fmt } from "./data.js";
import { buildStreet } from "./world/index.js";
import { createCharacter } from "./character.js";
import { createAudio } from "./audio.js";
import { createUI } from "./ui.js";
import { toonUniforms } from "./toon.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
const compactScreen = window.matchMedia("(max-width: 720px)").matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compactScreen ? 1.5 : 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x263552, 1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x263552);
scene.fog = new THREE.Fog(0x71869a, 55, 190);

scene.add(new THREE.HemisphereLight(0xc2e2ef, 0x5b4a42, 1.35));
const moon = new THREE.DirectionalLight(0xd8e7ff, 0.62);
moon.position.set(-8, 18, 6);
scene.add(moon);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 170);
const STALL_TRIGGER_RADIUS = 0.95;
const STALL_CLICK_RADIUS = 1.45;
const STALL_TARGET_RADIUS = 0.82;

const world = buildStreet(scene);
const character = createCharacter();
character.group.position.set(0, 0, 13.2);
character.group.rotation.y = Math.PI;
scene.add(character.group);

const audio = createAudio();
const ui = createUI();

const state = {
  spent: 0,
  purchases: [],
  bags: 0,
  guesses: [],
  clock: 19 * 60 + 40,
  started: false,
  ended: false,
  firstBuy: true,
  route: [],
  routeTimer: 0,
};

const floats = [];
let nearbyStall = null;
let modalOpen = false;
const armed = new Set(STALLS.map((stall) => stall.id));

// 开局视角：沿街低斜视角（由用户在实机上选取），可拖拽旋转、滚轮缩放。
const initialDistance = compactScreen ? 12.4 : 14.8;
const view = { yaw: -0.679, pitch: 0.705, dist: initialDistance, distTarget: initialDistance, fov: 40 };
let cameraMode = "follow";

const keys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const moveDir = new THREE.Vector3();
const lookTarget = new THREE.Vector3(0, 0.9, character.group.position.z - 2.4);
let moveTarget = null;
let speed01 = 0;

function clockText() {
  const hours = Math.floor(state.clock / 60) % 24;
  const minutes = Math.floor(state.clock % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function lerpAngle(from, to, t) {
  let delta = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

function updateRigTarget() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  view.fov = aspect >= 1.25 ? 40 : aspect >= 0.95 ? 48 : 52;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  updateRigTarget();
}

window.addEventListener("resize", resize);

const pointers = new Map();
let dragDistance = 0;
let pinchDistance = 0;

function screenToGround(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, hit)) return null;
  hit.x = THREE.MathUtils.clamp(hit.x, -world.walkHalf, world.walkHalf);
  hit.z = THREE.MathUtils.clamp(hit.z, world.bounds.zMin, world.bounds.zMax);
  return hit;
}

function pointerSpread() {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture?.(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) pinchDistance = pointerSpread();
  dragDistance = 0;
});

canvas.addEventListener("pointermove", (event) => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const spread = pointerSpread();
    if (pinchDistance > 0) {
      view.distTarget = THREE.MathUtils.clamp(
        view.distTarget * (pinchDistance / Math.max(1, spread)),
        9,
        62,
      );
    }
    pinchDistance = spread;
    return;
  }
  dragDistance += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
  if (dragDistance > 6) {
    view.yaw -= (event.clientX - previous.x) * 0.006;
    view.pitch = THREE.MathUtils.clamp(
      view.pitch - (event.clientY - previous.y) * 0.004,
      0.42,
      1.24,
    );
  }
});

canvas.addEventListener("pointerup", (event) => {
  const previous = pointers.get(event.pointerId);
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchDistance = 0;
  if (!previous || dragDistance > 6) return;
  if (!state.started || state.ended || pointers.size > 0) return;
  const hit = screenToGround(event.clientX, event.clientY);
  if (hit) {
    let zoneStall = null;
    let zoneDistance = STALL_CLICK_RADIUS;
    for (const stall of world.stalls) {
      const distance = Math.hypot(stall.anchor.x - hit.x, stall.anchor.z - hit.z);
      if (distance < zoneDistance) {
        zoneDistance = distance;
        zoneStall = stall;
      }
    }
    if (zoneStall) {
      const offsetX = hit.x - zoneStall.anchor.x;
      const offsetZ = hit.z - zoneStall.anchor.z;
      const offsetLength = Math.hypot(offsetX, offsetZ);
      const insideZone =
        Math.hypot(
          character.group.position.x - zoneStall.anchor.x,
          character.group.position.z - zoneStall.anchor.z,
        ) < STALL_TRIGGER_RADIUS;
      if (insideZone) openStall(zoneStall);
      else {
        const targetRadius = Math.min(STALL_TARGET_RADIUS, offsetLength);
        const scale = offsetLength > 0 ? targetRadius / offsetLength : 0;
        moveTarget = new THREE.Vector3(
          zoneStall.anchor.x + offsetX * scale,
          0,
          zoneStall.anchor.z + offsetZ * scale,
        );
      }
      return;
    }
    moveTarget = hit;
  }
});

canvas.addEventListener("pointercancel", (event) => {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchDistance = 0;
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (
    key === "e" &&
    nearbyStall &&
    !modalOpen &&
    !state.ended &&
    !ui.currentStall()
  ) {
    openStall(nearbyStall);
    return;
  }
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    keys.add(key);
    moveTarget = null;
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener(
  "wheel",
  (event) => {
    view.distTarget = THREE.MathUtils.clamp(view.distTarget + Math.sign(event.deltaY) * 2.6, 9, 62);
  },
  { passive: true },
);

function purchaseName(stall, item) {
  return item.label.includes(stall.name) ? item.label : `${stall.name} · ${item.label}`;
}

function purchase(stall, item) {
  if (state.ended || !state.started) return false;
  state.spent += item.price;
  if (!item.addon) {
    state.bags += 1;
    character.setBags(state.bags);
  }
  state.clock += 2;
  ui.setClock(clockText());

  let note = item.note || "";
  if (!note && stall.outcomes) {
    note = stall.outcomes[Math.floor(Math.random() * stall.outcomes.length)];
  }

  state.purchases.push({
    name: purchaseName(stall, item),
    price: item.price,
    note,
    pos: stall.anchor.clone(),
  });

  audio.coin();
  ui.toast(note ? `${item.label} · ${note}` : `${item.label} 到手`);
  floats.push({
    el: ui.addFloat(`${item.label} ¥${fmt(item.price)}`),
    pos: stall.anchor.clone().setY(1.9),
    t: 0,
    ttl: 1.5,
  });

  if (state.firstBuy) {
    state.firstBuy = false;
    ui.toast("老板找了一把零钱");
  }

  return true;
}

function openStall(stall) {
  audio.click();
  armed.delete(stall.id);
  moveTarget = null;
  ui.hideInteract();
  ui.openStall(stall, {
    buy(target, item, button) {
      const ok = purchase(target, item);
      if (ok && button) {
        ui.purchaseFeedback(button, `买了 ${purchaseName(target, item)}`);
        button.classList.add("bought");
        setTimeout(() => button.classList.remove("bought"), 420);
      }
      return ok;
    },
    weigh(target, ids) {
      const pieces = ids.map((id) => target.pieces.find((piece) => piece.id === id)).filter(Boolean);
      if (!pieces.length) return null;
      const jitter = 0.94 + Math.random() * 0.12;
      const rawMeat = pieces.filter((piece) => piece.kind === "meat").reduce((sum, piece) => sum + piece.weight, 0);
      const rawVeg = pieces.filter((piece) => piece.kind === "veg").reduce((sum, piece) => sum + piece.weight, 0);
      const meatWeight = Math.round(rawMeat * jitter * 10) / 10;
      const vegWeight = Math.round(rawVeg * jitter * 10) / 10;
      const weight = Math.round((meatWeight + vegWeight) * 10) / 10;
      const price =
        Math.round((meatWeight * target.unitPrices.meat) / 10) * 10 +
        Math.round((vegWeight * target.unitPrices.veg) / 10) * 10;
      const counts = new Map();
      for (const piece of pieces) {
        if (!counts.has(piece.id)) counts.set(piece.id, { piece, amount: 0 });
        counts.get(piece.id).amount += 1;
      }
      const summary = [...counts.values()]
        .map(({ piece, amount }) => `${piece.label}${amount}${piece.unit}`)
        .join(" + ");
      return {
        price,
        weight,
        meatWeight,
        vegWeight,
        unitPrices: target.unitPrices,
        label: `卤味 · ${summary}`,
      };
    },
  });
}

function updateInteraction() {
  const position = character.group.position;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const stall of world.stalls) {
    const distance = stall.anchor.distanceTo(position);
    if (distance > 4.8) armed.add(stall.id);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = stall;
    }
  }
  nearbyStall =
    state.started &&
    !state.ended &&
    !modalOpen &&
    !ui.currentStall() &&
    nearest &&
    nearestDistance < STALL_TRIGGER_RADIUS
      ? nearest
      : null;
  if (nearbyStall && armed.has(nearbyStall.id)) {
    openStall(nearbyStall);
    return;
  }
  if (nearbyStall) ui.showInteract(`点单 · ${nearbyStall.name}`);
  else ui.hideInteract();
  const current = ui.currentStall();
  if (current && current.anchor.distanceTo(position) > 4.8) ui.closeStall();
  if (current) ui.hideInteract();
}

function updateMovement(dt) {
  moveDir.set(0, 0, 0);
  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const forward = keys.has("w") || keys.has("arrowup");
  const back = keys.has("s") || keys.has("arrowdown");
  moveDir.x = (right ? 1 : 0) - (left ? 1 : 0);
  moveDir.z = (back ? 1 : 0) - (forward ? 1 : 0);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
  } else if (moveTarget) {
    const delta = moveTarget.clone().sub(character.group.position);
    delta.y = 0;
    if (delta.length() < 0.2) moveTarget = null;
    else moveDir.copy(delta.normalize());
  }

  speed01 = 0;
  if (state.started && !state.ended && moveDir.lengthSq() > 0) {
    const speed = 3.2;
    character.group.position.addScaledVector(moveDir, speed * dt);
    character.group.position.x = THREE.MathUtils.clamp(character.group.position.x, -world.walkHalf, world.walkHalf);
    character.group.position.z = THREE.MathUtils.clamp(
      character.group.position.z,
      world.bounds.zMin,
      world.bounds.zMax,
    );
    character.group.rotation.y = lerpAngle(
      character.group.rotation.y,
      Math.atan2(moveDir.x, moveDir.z),
      1 - Math.exp(-12 * dt),
    );
    speed01 = 1;
  }
  character.update(dt, speed01);
}

function updateCamera(dt) {
  if (cameraMode === "reveal") view.distTarget = 46;
  view.dist += (view.distTarget - view.dist) * (1 - Math.exp(-3.2 * dt));

  const base = new THREE.Vector3(0, 0, 0);
  const blend = THREE.MathUtils.clamp((view.dist - 21) / 20, 0, 1);
  const focus = character.group.position.clone().lerp(base, blend);
  const horizontal = Math.cos(view.pitch) * view.dist;

  const target = new THREE.Vector3(
    focus.x + Math.sin(view.yaw) * horizontal,
    focus.y + Math.sin(view.pitch) * view.dist,
    focus.z + Math.cos(view.yaw) * horizontal,
  );
  const look = new THREE.Vector3(focus.x, focus.y + 0.9, focus.z - 2.4 + blend * 2.4);

  camera.position.lerp(target, 1 - Math.exp(-7 * dt));
  lookTarget.lerp(look, 1 - Math.exp(-7 * dt));
  camera.lookAt(lookTarget);

  if (Math.abs(camera.fov - view.fov) > 0.05) {
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
  }
}

function updateFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i -= 1) {
    const item = floats[i];
    item.t += dt;
    const ratio = item.t / item.ttl;
    if (ratio >= 1) {
      item.el.remove();
      floats.splice(i, 1);
      continue;
    }
    const point = item.pos.clone();
    point.y += ratio * 0.9;
    const projected = point.project(camera);
    if (projected.z > 1) {
      item.el.style.opacity = "0";
      continue;
    }
    item.el.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
    item.el.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
    item.el.style.opacity = String(Math.max(0, 1 - ratio));
  }
}

function updateSizzle() {
  let level = 0;
  if (state.started && !state.ended) {
    for (const stall of world.stalls) {
      if (!["griddle", "grill", "fry", "chestnut"].includes(stall.kind)) continue;
      const distance = stall.position.distanceTo(character.group.position);
      level = Math.max(level, Math.max(0, 1 - distance / 14) * 0.16);
    }
  }
  audio.setSizzle(level);
}

function accuracyVerdict(pct, over) {
  if (pct == null) {
    return { title: "今晚的小票", comment: "这次没留数。下次离开前在心里报个价，回来就能看到你的实力。" };
  }
  if (pct <= 3) {
    return { title: "人形计算器", comment: "离谱级别的准！误差小到像收银机亲自报的数，今晚的每一块钱都被你盯得死死的。" };
  }
  if (pct <= 10) {
    return { title: "心里有数", comment: "稳得可怕！花在哪儿你门儿清，这点偏差连小数点都不好意思抬头。" };
  }
  if (pct <= 20) {
    return { title: "大概有数", comment: "方向拿捏得死死的！只差一点点细节，再抠一抠，人形计算器就是你了。" };
  }
  if (pct <= 35) {
    return over
      ? { title: "虚惊一场", comment: "预估值一路往上飘，结果账本比你想象的温柔。钱还在，只是你想多了。" }
      : { title: "钱好像长了腿", comment: "能在夜市全身而退已经很厉害了！不是你不会算，是摊主们太会卖。" };
  }
  return over
    ? { title: "自己吓自己", comment: "你把账往高了猜了一大截，其实钱花得比你想的少。今晚的夜市没你想象的那么狠。" }
    : { title: "钱去哪了", comment: "别慌，这不怪你，是夜市太会了！今晚先交个学费，下次一定把钱看住。" };
}

function endNight(guess) {
  if (state.ended) return;
  state.ended = true;
  cameraMode = "reveal";
  ui.closeStall();
  world.reveal(
    state.route,
    state.purchases.map((purchase_) => purchase_.pos),
  );

  const spent = state.spent;
  const hasGuess = guess != null;
  const error = hasGuess ? Math.abs(guess * 100 - spent) : null;
  const pct = !hasGuess ? null : spent > 0 ? (error / spent) * 100 : error === 0 ? 0 : null;
  const over = hasGuess && guess * 100 > spent;
  const verdict =
    state.purchases.length === 0
      ? { title: "空手而归", comment: "零消费通关！神仙级别的定力，钱包完好无损，今晚的夜市输给了你。" }
      : accuracyVerdict(pct, over);
  const diffText = !hasGuess
    ? ""
    : error === 0
      ? "一分不差"
      : `这次${guess * 100 < spent ? "少估" : "多估"}了 ¥${fmt(error)}`;

  const payload = {
    title: verdict.title,
    comment: verdict.comment,
    spent,
    guess: hasGuess ? guess * 100 : null,
    pct,
    diffText,
    purchases: state.purchases,
    stats: [
      { label: "买了", value: `${state.purchases.length} 样` },
      { label: "离开夜市", value: clockText() },
    ],
  };
  setTimeout(() => ui.showReceipt(payload), 1500);
}

function restart() {
  state.spent = 0;
  state.purchases = [];
  state.bags = 0;
  state.guesses = [];
  state.clock = 19 * 60 + 40;
  state.ended = false;
  state.firstBuy = true;
  state.route = [];
  state.routeTimer = 0;

  character.group.position.set(0, 0, 13.2);
  character.group.rotation.y = Math.PI;
  character.setBags(0);

  world.resetReveal();
  cameraMode = "follow";
  moveTarget = null;

  nearbyStall = null;
  modalOpen = false;
  armed.clear();
  STALLS.forEach((stall) => armed.add(stall.id));
  ui.hideInteract();
  floats.forEach((item) => item.el.remove());
  floats.length = 0;

  ui.hideReceipt();
  ui.closeStall();
  ui.closeGuess();
  ui.setClock(clockText());
}

ui.onStart(() => {
  if (state.started) return;
  ui.hideStart();
  ui.showIntro();
});

ui.onEnter(() => {
  if (state.started) return;
  state.started = true;
  audio.ensure();
  ui.hideIntro();
  ui.showHud();
  ui.setClock(clockText());
});

ui.onClose(() => ui.closeStall());

ui.onSound(() => {
  const muted = audio.toggle();
  ui.setSoundLabel(muted ? "静音" : "声音");
});

ui.onHome(() => {
  if (!state.started || state.ended) return;
  modalOpen = true;
  ui.closeStall();
  ui.openGuess(
    { title: "最后猜一次，花了多少", value: 100, confirmLabel: "看结果" },
    (value) => {
      modalOpen = false;
      if (value != null) state.guesses.push({ value, actual: state.spent });
      endNight(value);
    },
  );
});

ui.onInteract(() => {
  if (!nearbyStall || state.ended || modalOpen || ui.currentStall()) return;
  openStall(nearbyStall);
});

ui.onAgain(restart);

let lastTime = performance.now();
let fpsFrames = 0;
let fpsTime = 0;
let fpsValue = 60;
let elapsed = 0;
let sampleRequested = false;
let lastSample = null;
let regionRequest = null;
let regionResult = null;

function sampleCanvas() {
  const gl = renderer.getContext();
  const size = 48;
  const tiles = [
    [0.24, 0.74],
    [0.5, 0.76],
    [0.76, 0.74],
    [0.24, 0.44],
    [0.5, 0.46],
    [0.76, 0.44],
  ];
  const pixels = new Uint8Array(size * size * 4);
  let sum = 0;
  let min = 255;
  let max = 0;
  let count = 0;
  for (const [fx, fy] of tiles) {
    const x = Math.floor((gl.drawingBufferWidth - size) * fx);
    const y = Math.floor((gl.drawingBufferHeight - size) * fy);
    gl.readPixels(x, y, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    for (let i = 0; i < size * size; i += 1) {
      const luminance = 0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2];
      sum += luminance;
      if (luminance < min) min = luminance;
      if (luminance > max) max = luminance;
      count += 1;
    }
  }
  return { mean: sum / count, min, max, tiles: tiles.length };
}

function sampleRegion(region) {
  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const x0 = Math.max(0, Math.floor((region[0] * 0.5 + 0.5) * width));
  const y0 = Math.max(0, Math.floor((region[1] * 0.5 + 0.5) * height));
  const x1 = Math.min(width, Math.ceil((region[2] * 0.5 + 0.5) * width));
  const y1 = Math.min(height, Math.ceil((region[3] * 0.5 + 0.5) * height));
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);
  const pixels = new Uint8Array(w * h * 4);
  gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let sum = 0;
  for (let i = 0; i < w * h; i += 1) {
    sum += 0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2];
  }
  return Math.round((sum / (w * h)) * 100) / 100;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0.016);
  lastTime = now;
  elapsed += dt;

  updateMovement(dt);

  if (state.started && !state.ended) {
    updateInteraction();
    state.routeTimer += dt;
    if (state.routeTimer > 0.35) {
      state.routeTimer = 0;
      state.route.push(character.group.position.clone());
    }
  }

  updateCamera(dt);
  world.update(dt, character.group.position, elapsed);
  updateFloats(dt);
  updateSizzle();

  toonUniforms.uCameraPos.value.copy(camera.position);
  renderer.render(scene, camera);

  if (sampleRequested) {
    sampleRequested = false;
    lastSample = sampleCanvas();
  }
  if (regionRequest) {
    regionResult = sampleRegion(regionRequest);
    regionRequest = null;
  }

  fpsFrames += 1;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fpsValue = fpsFrames / fpsTime;
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (!window.__ready) window.__ready = true;
}

window.__debug = {
  scene,
  get state() {
    return {
      spent: state.spent,
      purchases: state.purchases.length,
      bags: state.bags,
      started: state.started,
      ended: state.ended,
      clock: clockText(),
    };
  },
  info: () => ({
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    points: renderer.info.render.points,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  }),
  fps: () => fpsValue,
  measureFps(ms = 1500) {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const tick = () => {
        frames += 1;
        const duration = performance.now() - start;
        if (duration >= ms) resolve({ fps: (frames * 1000) / duration, info: window.__debug.info() });
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },
  requestSample() {
    sampleRequested = true;
  },
  sample: () => lastSample,
  requestRegion(x0, y0, x1, y1) {
    regionRequest = [x0, y0, x1, y1];
  },
  region: () => regionResult,
  probe(x, y) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    return raycaster
      .intersectObjects(scene.children, true)
      .slice(0, 6)
      .map((hit) => ({
        name: hit.object.name || hit.object.type,
        distance: Math.round(hit.distance * 100) / 100,
        point: hit.point.toArray().map((value) => Math.round(value * 100) / 100),
      }));
  },
  setView(partial) {
    Object.assign(view, partial);
    return { ...view };
  },
  getView() {
    return { ...view };
  },
  character() {
    const world3 = character.group.position.clone();
    const head = world3.clone();
    head.y += 1.45;
    const projected = head.project(camera);
    return {
      position: world3.toArray(),
      screen: [projected.x, projected.y, projected.z],
      meshes: character.group.children.length,
      onScreen: projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1,
    };
  },
  screenForStall(id) {
    const stall = world.stalls.find((item) => item.id === id);
    if (!stall) return null;
    const point = stall.anchor.clone();
    point.y = 0.06;
    point.project(camera);
    return {
      x: (point.x * 0.5 + 0.5) * window.innerWidth,
      y: (-point.y * 0.5 + 0.5) * window.innerHeight,
      onScreen: point.z < 1 && Math.abs(point.x) < 1 && Math.abs(point.y) < 1,
    };
  },
  gotoStall(id) {
    const stall = world.stalls.find((item) => item.id === id);
    if (!stall) return false;
    character.group.position.set(stall.anchor.x, 0, stall.anchor.z);
    moveTarget = null;
    return true;
  },
  buy(id, itemId) {
    const stall = world.stalls.find((item) => item.id === id);
    if (!stall) return false;
    const item = (stall.items || []).find((entry) => entry.id === itemId);
    if (!item) return false;
    return purchase(stall, item);
  },
  finish(guess) {
    endNight(guess ?? null);
  },
  restart,
};

camera.position.set(
  Math.sin(view.yaw) * Math.cos(view.pitch) * view.dist,
  Math.sin(view.pitch) * view.dist,
  character.group.position.z + Math.cos(view.yaw) * Math.cos(view.pitch) * view.dist,
);
camera.lookAt(lookTarget);
resize();
renderer.setAnimationLoop(frame);
