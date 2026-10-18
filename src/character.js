import * as THREE from "three";
import { createOutlineMaterial, createToonMaterial } from "./toon.js";

export function createCharacter() {
  const group = new THREE.Group();

  const mats = {
    shirt: createToonMaterial({ tint: 0xf4745a }),
    pants: createToonMaterial({ tint: 0x3a4a78 }),
    skin: createToonMaterial({ tint: 0xf2c69b }),
    hair: createToonMaterial({ tint: 0x241f2e }),
    bag: createToonMaterial({ tint: 0xe4dcc8 }),
  };

  const outlineMaterial = createOutlineMaterial(1.3);
  const outlined = (mesh) => {
    mesh.add(new THREE.Mesh(mesh.geometry, outlineMaterial));
    return mesh;
  };

  const torso = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.28), mats.shirt));
  torso.position.y = 0.8;

  const head = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.34), mats.skin));
  head.position.y = 1.25;

  const hair = outlined(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.38), mats.hair));
  hair.position.y = 1.44;

  const armGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  armGeo.translate(0, -0.22, 0);
  const armL = outlined(new THREE.Mesh(armGeo, mats.skin));
  armL.position.set(-0.3, 1.02, 0);
  const armR = outlined(new THREE.Mesh(armGeo, mats.skin));
  armR.position.set(0.3, 1.02, 0);

  const legGeo = new THREE.BoxGeometry(0.15, 0.52, 0.15);
  legGeo.translate(0, -0.24, 0);
  const legL = outlined(new THREE.Mesh(legGeo, mats.pants));
  legL.position.set(-0.13, 0.52, 0);
  const legR = outlined(new THREE.Mesh(legGeo, mats.pants));
  legR.position.set(0.13, 0.52, 0);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.44, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffb066,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;

  const bags = new THREE.Group();
  const bagGeo = new THREE.BoxGeometry(0.28, 0.32, 0.2);
  for (let i = 0; i < 3; i += 1) {
    const bag = new THREE.Mesh(bagGeo, mats.bag);
    bag.position.set(-0.36 - i * 0.04, 0.5 - i * 0.05, -0.02 + i * 0.06);
    bag.visible = false;
    bags.add(bag);
  }

  group.add(halo, shadow, torso, head, hair, armL, armR, legL, legR, bags);

  let phase = 0;

  return {
    group,
    update(dt, speed01) {
      phase += dt * (2.2 + 7 * speed01);
      const swing = Math.sin(phase) * (0.12 + 0.5 * speed01);
      armL.rotation.x = swing;
      armR.rotation.x = -swing;
      legL.rotation.x = -swing;
      legR.rotation.x = swing;

      const bob = Math.abs(Math.sin(phase)) * 0.035 * speed01;
      torso.position.y = 0.8 + bob;
      head.position.y = 1.25 + bob;
      hair.position.y = 1.44 + bob;
      armL.position.y = 1.02 + bob;
      armR.position.y = 1.02 + bob;
      bags.position.y = bob * 0.7;
    },
    setBags(count) {
      bags.children.forEach((bag, i) => {
        bag.visible = i < Math.min(count, 3);
      });
    },
  };
}
