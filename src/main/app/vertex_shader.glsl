attribute vec3 customColor;

varying vec3 vColor;

void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = 30.0 / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
