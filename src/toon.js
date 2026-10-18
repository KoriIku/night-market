import * as THREE from "three";

export const toonUniforms = {
  uLightDir: { value: new THREE.Vector3(-0.42, 0.86, 0.3).normalize() },
  uCameraPos: { value: new THREE.Vector3() },
  uLitColor: { value: new THREE.Color(1.4, 1.31, 1.12) },
  uShadowColor: { value: new THREE.Color(0.8, 0.92, 1.02) },
  uAmbientColor: { value: new THREE.Color(1.12, 1.06, 0.94) },
  uAmbient: { value: 0.44 },
  uRimColor: { value: new THREE.Color(1.0, 0.87, 0.62) },
  uRimStrength: { value: 0.48 },
  uRimPower: { value: 2.6 },
  uFogColor: { value: new THREE.Color(0x71869a) },
  uFogNear: { value: 34 },
  uFogFar: { value: 130 },
  uOutlineColor: { value: new THREE.Color(0x3d3748) },
  uOutlineWidth: { value: 1.0 },
};

const VERTEX = `
  #ifdef USE_VERTEX_COLOR
    attribute vec3 color;
  #endif
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  #ifdef USE_MAP
    varying vec2 vUv;
  #endif
  void main() {
    #ifdef USE_VERTEX_COLOR
      vColor = color;
    #else
      vColor = vec3(1.0);
    #endif
    #ifdef USE_MAP
      vUv = uv;
    #endif
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT = `
  uniform vec3 uLitColor;
  uniform vec3 uShadowColor;
  uniform vec3 uAmbientColor;
  uniform float uAmbient;
  uniform vec3 uRimColor;
  uniform vec3 uTint;
  uniform vec3 uLightDir;
  uniform vec3 uCameraPos;
  uniform vec3 uFogColor;
  uniform float uRimStrength;
  uniform float uRimPower;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  #ifdef USE_MAP
    varying vec2 vUv;
  #endif

  void main() {
    vec3 normalW = normalize(vNormalW);
    vec3 lightDir = normalize(uLightDir);
    float halfLambert = dot(normalW, lightDir) * 0.5 + 0.5;
    float ramp = smoothstep(0.42, 0.52, halfLambert) * 0.62 + smoothstep(0.66, 0.74, halfLambert) * 0.38;
    vec3 base = vColor * uTint;
    #ifdef USE_MAP
      base *= texture2D(uMap, vUv).rgb;
    #endif
    vec3 color = mix(base * uShadowColor, base * uLitColor, ramp);
    color = mix(color, base * uAmbientColor, uAmbient);

    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float rim = pow(1.0 - clamp(dot(normalW, viewDir), 0.0, 1.0), uRimPower) * uRimStrength;
    color += uRimColor * rim * (0.35 + 0.65 * ramp);

    float fog = smoothstep(uFogNear, uFogFar, distance(uCameraPos, vWorldPos));
    color = mix(color, uFogColor, fog);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const OUTLINE_VERTEX = `
  uniform float uOutlineWidth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 normalV = normalize(normalMatrix * normal);
    float distanceScale = clamp(-mv.z, 0.6, 22.0);
    mv.xyz += normalV * uOutlineWidth * distanceScale * 0.0055;
    gl_Position = projectionMatrix * mv;
  }
`;

const OUTLINE_FRAGMENT = `
  uniform vec3 uOutlineColor;
  void main() {
    gl_FragColor = vec4(uOutlineColor, 1.0);
  }
`;

export function createToonMaterial({ tint = 0xffffff, vertexColors = false, side = THREE.FrontSide, map = null } = {}) {
  const defines = {};
  if (vertexColors) defines.USE_VERTEX_COLOR = 1;
  if (map) defines.USE_MAP = 1;
  return new THREE.ShaderMaterial({
    defines,
    uniforms: {
      ...toonUniforms,
      uTint: { value: new THREE.Color(tint) },
      uMap: { value: map },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side,
  });
}

export function createOutlineMaterial(width = 1) {
  const uniforms = { ...toonUniforms, uOutlineWidth: { value: width } };
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    side: THREE.BackSide,
  });
}
