import THREE from "three";
import { rgb2lch, rgb2xyz, rgb2lab, hsluv } from "./chroma";

console.log(shadow);

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

export function pointsBufferFromArray(dots) {
  const nDots = dots.length;
  const arr = new Float32Array(nDots * 3);
  for (let i = 0; i < nDots; i++) {
    arr.set(dots[i], i* 3);
  }
  return arr;
};

export function computePositionArray(dots) {
  const nDots = dots.length;
  const arr = new Float32Array(nDots * 3);
  for (let i = 0; i < nDots; i++) {
    arr.set(dots[i].map(x => x * 2 - 1), i* 3);
  }
  return arr;
};

export function computeColorArray(dots) {
  const nDots = dots.length;
  const arr = new Float32Array(nDots * 3);
  for (let i = 0; i < nDots; i++) {
    arr.set(dots[i], i * 3);
  }
  return arr;
};

export function computePositions(nDots) {
  const positions = new Float32Array(nDots * 3);
  for (let i = 0; i < nDots; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const position = new THREE.Vector3(x * 2 - 1, y * 2 - 1, z * 2 - 1);
    position.toArray(positions, i * 3);
  }
  return positions;
};

export const computeColors = (nDots) => {
  const colors = new Float32Array(nDots * 3);
  for (let i = 0; i < nDots; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const color = new THREE.Color(r, g, b);
    color.toArray(colors, i * 3);

    sizes[i] = PARTICLE_SIZE * 0.5;
  }
  return colors;
};

export const computeCrosshairsMaterial = (vertexShader, fragmentShader) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      pointTexture: { value: new THREE.TextureLoader().load("textures/crosshairs.png") },
    },
    vertexShader,
    fragmentShader,
    alphaTest: 0.99,
  });
  return material;
};

export const computeDiscMaterial = (vertexShader, fragmentShader) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      pointTexture: { value: new THREE.TextureLoader().load("textures/disc.png") },
    },
    vertexShader,
    fragmentShader,
    alphaTest: 0.99,
  });
  return material;
};
