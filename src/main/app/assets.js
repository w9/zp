import THREE from "three";

export const drawDotCanvas = () => {
  const canvas = document.createElement("canvas");
  document.body.prepend(canvas);

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

export const computeVDots = () => {
  const N_DOTS = 1000000;
  const positions = new Float32Array(N_DOTS * 3);
  const colors = new Float32Array(N_DOTS * 3);
  for (let i = 0; i < 1000000; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const position = new THREE.Vector3(x * 2 - 1, y * 2 - 1, z * 2 - 1);
    position.toArray(positions, i * 3);

    const color = new THREE.Color(x, y, z);
    color.toArray(colors, i * 3);
  }

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
  gl_PointSize = size * ( 30000.0 / -mvPosition.z );
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

  return { positions, colors, material };
};
