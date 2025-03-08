// common.glsl
//
// Common GLSL functions and utilities for fractal shaders

// Constants
#define PI 3.14159265359
#define TAU 6.28318530718
#define LOG2 0.6931471805599453

// Complex number operations
vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cDiv(vec2 a, vec2 b) {
  float denom = dot(b, b);
  return vec2(
    (a.x * b.x + a.y * b.y) / denom,
    (a.y * b.x - a.x * b.y) / denom
  );
}

vec2 cPow(vec2 z, float power) {
  float r = length(z);
  float theta = atan(z.y, z.x);
  return pow(r, power) * vec2(cos(power * theta), sin(power * theta));
}

vec2 cLog(vec2 z) {
  float r = length(z);
  float theta = atan(z.y, z.x);
  return vec2(log(r), theta);
}

vec2 cExp(vec2 z) {
  return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 cSin(vec2 z) {
  return vec2(sin(z.x) * cosh(z.y), cos(z.x) * sinh(z.y));
}

vec2 cCos(vec2 z) {
  return vec2(cos(z.x) * cosh(z.y), -sin(z.x) * sinh(z.y));
}

// Utility functions
vec2 rotate(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

// Color utilities
vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Palette interpolation function
vec3 paletteColor(float t, vec3 palette[8]) {
  // Ensure t is in [0, 1]
  t = fract(t);
  // Scale to palette range
  float idx = t * 7.0; // 7 segments between 8 colors
  int index = int(idx);
  float fract_t = fract(idx);

  // Smooth interpolation between colors
  vec3 color1 = palette[index];
  vec3 color2 = palette[index + 1];
  return mix(color1, color2, fract_t);
}

// Distance estimation functions for 3D fractals
float sphereFold(inout vec3 z, float minRadius, float fixedRadius) {
  float r2 = dot(z, z);
  float scale = clamp(fixedRadius / r2, 1.0, fixedRadius / (minRadius * minRadius));
  z *= scale;
  return scale;
}

void boxFold(inout vec3 z, vec3 folding) {
  z = clamp(z, -folding, folding) * 2.0 - z;
}

// Smooth minimum function
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}