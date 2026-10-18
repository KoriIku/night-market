import * as THREE from "three";
import { makeSoftTexture } from "./textures.js";
export class Steam {
  constructor(scene, max = 300) {
    this.max = max;
    this.cursor = 0;
    this.position = new Float32Array(max * 3);
    this.velocity = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.color = new Float32Array(max * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.position, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(this.color, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 60);

    const material = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: makeSoftTexture() } },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = aAlpha;
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = min(64.0, aSize * (70.0 / max(1.0, -mv.z)));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          float a = tex.a * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.name = "steamPoints";
    this.points.frustumCulled = false;
    this.geometry = geometry;
    scene.add(this.points);
  }

  spawn(x, y, z, warm) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.position[i * 3] = x + (Math.random() - 0.5) * 0.6;
    this.position[i * 3 + 1] = y;
    this.position[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
    this.velocity[i * 3] = (Math.random() - 0.5) * 0.24;
    this.velocity[i * 3 + 1] = 0.6 + Math.random() * 0.55;
    this.velocity[i * 3 + 2] = (Math.random() - 0.5) * 0.24;
    const maxLife = 1.6 + Math.random() * 1.6;
    this.maxLife[i] = maxLife;
    this.life[i] = maxLife;
    this.size[i] = 14 + Math.random() * 16;
    if (warm) {
      this.color[i * 3] = 1;
      this.color[i * 3 + 1] = 0.78;
      this.color[i * 3 + 2] = 0.5;
    } else {
      this.color[i * 3] = 0.86;
      this.color[i * 3 + 1] = 0.88;
      this.color[i * 3 + 2] = 0.96;
    }
    this.geometry.attributes.aColor.needsUpdate = true;
  }

  update(dt, focus, sources) {
    let budget = 6;
    for (const source of sources) {
      const distance = Math.hypot(source.position.x - focus.x, source.position.z - focus.z);
      if (distance > 24) continue;
      source.acc += dt * source.rate * Math.max(0.15, 1 - distance / 28);
      while (source.acc >= 1 && budget > 0) {
        source.acc -= 1;
        budget -= 1;
        this.spawn(source.position.x, source.position.y, source.position.z, source.warm);
      }
    }

    for (let i = 0; i < this.max; i += 1) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0;
        continue;
      }
      this.life[i] -= dt;
      const ratio = Math.max(0, this.life[i] / this.maxLife[i]);
      this.position[i * 3] += this.velocity[i * 3] * dt;
      this.position[i * 3 + 1] += this.velocity[i * 3 + 1] * dt;
      this.position[i * 3 + 2] += this.velocity[i * 3 + 2] * dt;
      this.velocity[i * 3 + 1] *= 0.995;
      this.size[i] += dt * 8;
      this.alpha[i] = ratio * 0.32;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}

export class Glows {
  constructor(scene, list) {
    this.list = list;
    const count = list.length;
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    this.alpha = new Float32Array(count);
    list.forEach((item, i) => {
      position[i * 3] = item.position.x;
      position[i * 3 + 1] = item.position.y;
      position[i * 3 + 2] = item.position.z;
      size[i] = item.size;
      this.alpha[i] = item.base;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 60);
    const material = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: makeSoftTexture() } },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = min(110.0, aSize * (150.0 / max(1.0, -mv.z)));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uTex, gl_PointCoord);
          float a = tex.a * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.86, 0.66, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.geometry = geometry;
    this.points = new THREE.Points(geometry, material);
    this.points.name = "glowPoints";
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  update(time) {
    for (let i = 0; i < this.list.length; i += 1) {
      const item = this.list[i];
      const flicker =
        0.78 +
        0.16 * Math.sin(time * item.speed + item.phase) +
        0.07 * Math.sin(time * 12.7 + item.phase * 2.1);
      this.alpha[i] = Math.max(0.2, item.base * flicker);
    }
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}
