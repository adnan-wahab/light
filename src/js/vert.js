import glsl from 'glslify';

const vs = `
precision mediump float;

attribute vec3 aVertex;
attribute vec3 aNormal;
attribute vec3 aTexCoord;

uniform mat4 uMV;
uniform mat4 uMVP;
uniform mat3 uN;
uniform mat4 uEM;
uniform mat3 uEN;

uniform float uAlpha;
uniform float uRoughness;
uniform float uMetallic;
uniform vec3 uAlbedo;

varying vec3 vVertex;
varying vec3 vNormal;
varying vec3 vAlbedo;

varying float vRoughness;
varying float vMetallic;
varying float vMasking;

void main() {
  vAlbedo = uAlbedo.x >= 0.0 ? uAlbedo : aNormal;
  vRoughness = uRoughness >= 0.0 ? uRoughness : aTexCoord.x;
  vMetallic = uMetallic >= 0.0 ? uMetallic : aTexCoord.y;

  vMasking = 0.;

  vNormal = mix(aNormal, uEN * aNormal, vMasking);
  vNormal = normalize(uN * vNormal);

  vec4 vertex4 = vec4(aVertex, 1.0);

  vertex4 = mix(vertex4, uEM * vertex4, vMasking);

  vVertex = vec3(uMV * vertex4);

  gl_Position = uMVP * vertex4;
}
  `;


export default { vs };
