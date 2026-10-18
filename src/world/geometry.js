import * as THREE from "three";
export function place(x, y, z, rx = 0, ry = 0, rz = 0) {
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  return new THREE.Matrix4().makeRotationFromQuaternion(quat).setPosition(x, y, z);
}

export function addPart(store, geom, color, keepUV = false) {
  let g = geom;
  if (g.index) {
    const converted = g.toNonIndexed();
    g.dispose();
    g = converted;
  }
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color(color);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (!keepUV) {
    g.deleteAttribute("uv");
    g.deleteAttribute("uv1");
    g.deleteAttribute("uv2");
  }
  store.push(g);
}

export function boxPart(store, w, h, d, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.applyMatrix4(place(x, y, z, rx, ry, rz));
  addPart(store, g, color);
}

export function cylPart(store, rTop, rBottom, h, segments, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments);
  g.applyMatrix4(place(x, y, z, rx, ry, rz));
  addPart(store, g, color);
}

export function spherePart(store, r, color, x, y, z, segments = 8) {
  const g = new THREE.SphereGeometry(r, segments, segments);
  g.applyMatrix4(place(x, y, z));
  addPart(store, g, color);
}

export function planePart(store, w, h, color, x, y, z, rx = 0, ry = 0, rz = 0, keepUV = false) {
  const g = new THREE.PlaneGeometry(w, h);
  g.applyMatrix4(place(x, y, z, rx, ry, rz));
  addPart(store, g, color, keepUV);
}

export function torusPart(store, r, tube, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.TorusGeometry(r, tube, 6, 12);
  g.applyMatrix4(place(x, y, z, rx, ry, rz));
  addPart(store, g, color);
}

export function tubePart(store, from, to, radius, color, segments = 5) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  if (length < 0.001) return;
  const g = new THREE.CylinderGeometry(radius, radius, length, segments);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  const middle = from.clone().addScaledVector(direction, 0.5);
  g.applyMatrix4(new THREE.Matrix4().compose(middle, quat, new THREE.Vector3(1, 1, 1)));
  addPart(store, g, color);
}

export function mergeParts(parts, keepUV = false) {
  const total = parts.reduce((sum, g) => sum + g.attributes.position.count, 0);
  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const color = keepUV ? null : new Float32Array(total * 3);
  const uv = keepUV ? new Float32Array(total * 2) : null;
  let offset = 0;
  for (const g of parts) {
    const count = g.attributes.position.count;
    position.set(g.attributes.position.array, offset * 3);
    normal.set(g.attributes.normal.array, offset * 3);
    if (color) color.set(g.attributes.color.array, offset * 3);
    if (uv) uv.set(g.attributes.uv.array, offset * 2);
    offset += count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(position, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  if (color) out.setAttribute("color", new THREE.BufferAttribute(color, 3));
  if (uv) out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  parts.length = 0;
  return out;
}
