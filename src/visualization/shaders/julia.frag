precision highp float;

// Common uniforms
uniform vec2 resolution;      // Viewport resolution (width, height)
uniform float time;           // Shader playback time (in seconds)

// Fractal parameters
uniform float centerX;        // X coordinate of the center point
uniform float centerY;        // Y coordinate of the center point
uniform float zoom;           // Zoom level
uniform int iterations;       // Maximum number of iterations
uniform float colorShift;     // Color cycling shift
uniform float rotationAngle;  // Rotation angle in radians
uniform float exponent;       // Power in the fractal formula z^exponent + c
uniform float bailout;        // Escape radius squared

// Julia-specific parameters
uniform float juliaReal;      // Real part of the Julia set parameter
uniform float juliaImag;      // Imaginary part of the Julia set parameter

// Color parameters
uniform int colorMode;        // 0: smooth, 1: bands, 2: histogram
uniform float colorCycles;    // Number of color cycles
uniform vec3 palette[8];      // Color palette with 8 colors

// Audio reactivity
uniform float audioVolume;    // Overall volume (0-1)
uniform float audioBass;      // Bass level (0-1)
uniform float audioMid;       // Mid frequencies (0-1)
uniform float audioTreble;    // Treble level (0-1)

// Transition parameters
uniform float transitionProgress;  // 0-1 for transitions
uniform float previousCenterX;     // Previous center X
uniform float previousCenterY;     // Previous center Y
uniform float previousZoom;        // Previous zoom level

// Varyings from vertex shader
varying vec2 vUv;

// Constants
const float LOG2 = 0.6931471805599453;
const float PI = 3.14159265359;

// Complex number operations
vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 complexPow(vec2 z, float power) {
  float r = length(z);
  float theta = atan(z.y, z.x);
  return pow(r, power) * vec2(cos(power * theta), sin(power * theta));
}

// Rotate a 2D vector
vec2 rotate(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

// Map a value from one range to another
float map(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

// Interpolate between colors in the palette
vec3 paletteColor(float t) {
  // Ensure t is in [0, 1]
  t = fract(t);
  // Scale to palette range
  float paletteIndex = t * 7.0; // 7 segments between 8 colors
  int index = int(paletteIndex);
  float fract_t = fract(paletteIndex);

  // Smooth interpolation between colors
  vec3 color1 = palette[index];
  vec3 color2 = palette[index + 1];
  return mix(color1, color2, fract_t);
}

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
  // Aspect-corrected coordinates
  vec2 uv = vUv * 2.0 - 1.0;
  float aspect = resolution.x / resolution.y;
  
  if (aspect > 1.0) {
    uv.x *= aspect;
  } else {
    uv.y /= aspect;
  }
  
  // Apply rotation
  uv = rotate(uv, rotationAngle);
  
  // Apply zoom and center
  uv = uv / zoom + vec2(centerX, centerY);
  
  // For Julia sets, we use a fixed c parameter and iterate z starting from the pixel coordinate
  vec2 c = vec2(juliaReal, juliaImag);
  
  // Audio-reactive distortion to Julia parameter
  if (audioBass > 0.6) {
    c += vec2(sin(time * 2.0) * audioBass * 0.03, cos(time * 1.7) * audioBass * 0.02);
  }
  
  // Initialize z from pixel coordinate (this is the key difference from Mandelbrot)
  vec2 z = uv;
  
  // Apply audio-reactive distortion to initial z
  if (audioMid > 0.5) {
    float distortion = audioMid * 0.03;
    z += vec2(sin(z.y * 5.0 + time) * distortion, cos(z.x * 5.0 + time) * distortion);
  }
  
  // Iteration variables
  int i;
  float smoothColor = 0.0;
  bool escaped = false;
  
  // Julia set iteration
  for (i = 0; i < 1000; i++) {
    // Break if we've reached max iterations
    if (i >= iterations) break;
    
    // z = z^exponent + c
    z = complexPow(z, exponent) + c;
    
    // Check if escaped
    if (dot(z, z) > bailout) {
      escaped = true;
      
      // Calculate smooth coloring
      float logZn = log(dot(z, z)) / 2.0;
      float nu = log(logZn / LOG2) / LOG2;
      smoothColor = float(i) + 1.0 - nu;
      
      break;
    }
  }
  
  // Determine coloring
  if (!escaped) {
    // Inside set (black or custom interior color)
    float interiorIntensity = 0.0;
    
    // Audio-reactive interior glow
    if (audioVolume > 0.3) {
      interiorIntensity = audioVolume * 0.2;
    }
    
    gl_FragColor = vec4(vec3(interiorIntensity), 1.0);
  } else {
    // Outside set - color based on escape iterations
    float t;
    
    if (colorMode == 0) {
      // Smooth coloring
      t = smoothColor / float(iterations);
      t = pow(t, 0.5); // Apply gamma for better color distribution
    } else if (colorMode == 1) {
      // Band coloring
      t = float(i) / float(iterations);
    } else {
      // Histogram-like coloring (simplified)
      t = sqrt(smoothColor / float(iterations));
    }
    
    // Apply color cycles and shift
    t = fract(t * colorCycles + colorShift);
    
    // Get color from palette
    vec3 color = paletteColor(t);
    
    // Audio-reactive effects
    if (audioBass > 0.5) {
      // Add pulsing glow based on bass
      float pulse = audioBass * sin(time * 5.0) * 0.2;
      color += vec3(pulse, pulse * 0.7, pulse * 0.3);
    }
    
    if (audioTreble > 0.6) {
      // Add high-frequency sparkles
      float sparkle = audioTreble * sin(dot(z, z) * 100.0 + time * 20.0) * 0.1;
      color += vec3(sparkle);
    }
    
    // Add subtle animation based on time
    float timeEffect = sin(time * 0.2) * 0.05;
    color *= 1.0 + timeEffect;
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
}