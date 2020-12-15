import THREE from "three";
import { rgb2lch, rgb2xyz, rgb2lab, hsluv } from "./chroma";

export const drawDotCanvas = () => {
  const canvas = document.createElement("canvas");

  const ctx = canvas.getContext("2d");
  ctx.canvas.width = 256;
  ctx.canvas.height = 256;

  // fill the background with tranparent black
  // ctx.fillStyle = "red";
  // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(127, 127, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(127, 127, 118, 0, Math.PI * 2);
  ctx.fill();

  return ctx.canvas;
};

export const computeDots = () => {
  const N_DOTS = 100000;
  const PARTICLE_SIZE = 12;

  const positions = new Float32Array(N_DOTS * 3);
  const colors = new Float32Array(N_DOTS * 3);
  const sizes = new Float32Array(N_DOTS);
  for (let i = 0; i < N_DOTS; i++) {
    const r = Math.random();
    const g = Math.random();
    const b = Math.random();

    // const [l, c, h] = rgb2lch([r, g, b]);
    // const position = new THREE.Vector3(h/100 - 1.7, c * 5 - 1, l * 7 - 1);
    // const [x, y, z] = rgb2xyz([r, g, b]);
    // const position = new THREE.Vector3(x * 1000 - 139, y * 1000 - 139, z * 1000 - 139);
    // const [l, a, b_] = rgb2lab([r, g, b]);
    // const position = new THREE.Vector3(a, b_, l);
    // const [h, s, l] = hsluv.rgbToHsluv([r, g, b]);
    // const position = new THREE.Vector3((h / 360) * 2 - 1, (s / 100) * 2 - 1, (l / 100) * 2 - 1);
    // const [l, c, h] = hsluv.rgbToLch([r, g, b]);
    // const position = new THREE.Vector3((h / 360) * 2 - 1, (c / 200) * 2 - 1, (l / 100) * 2 - 1);
    const [x, y, z] = hsluv.rgbToXyz([r, g, b]);
    const position = new THREE.Vector3(x, y, z);
    position.toArray(positions, i * 3);

    const color = new THREE.Color(r, g, b);
    color.toArray(colors, i * 3);

    sizes[i] = PARTICLE_SIZE * 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      pointTexture: { value: new THREE.TextureLoader().load("textures/disc.png") },
    },
    vertexShader: `

attribute float size;
attribute vec3 customColor;

varying vec3 vColor;

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * ( 3.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}

`,
    fragmentShader: `

uniform vec3 color;
uniform sampler2D pointTexture;

varying vec3 vColor;

void main() {
  gl_FragColor = vec4( color * vColor, 1.0 );
  gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
  if ( gl_FragColor.a < ALPHATEST ) discard;
}

`,

    alphaTest: 0.9,
  });

  const points = new THREE.Points(geometry, material);

  return points;
};
