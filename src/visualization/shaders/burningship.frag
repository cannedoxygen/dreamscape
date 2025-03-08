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
  
  // Audio-reactive distortion
  if (audioBass > 0.5) {
    float distortion = audioBass * 0.05;
    uv += vec2(
      sin(uv.y * 10.0 + time) * distortion,
      cos(uv.x * 10.0 + time) * distortion
    );
  }
  
  // Burning Ship fractal iteration variables
  vec2 z = vec2(0.0, 0.0);
  vec2 c = uv;
  
  // Mandelbrot iteration with taking absolute values (Burning Ship)
  int i;
  for (i = 0; i < 1000; i++) {
    // Break if we've reached max iterations
    if (i >= iterations) break;
    
    // Burning Ship formula: z = (|Re(z)| + i|Im(z)|)^2 + c
    z = vec2(abs(z.x), abs(z.y)); // This is what makes it a Burning Ship fractal
    
    // Standard mandelbrot iteration, but using absolute values of z
    z = complexMul(z, z) + c;
    
    // Check if escaped
    if (dot(z, z) > bailout) break;
  }
  
  // Determine coloring based on iterations
  if (i >= iterations) {
    // Inside set (black)
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    // Smooth coloring based on how quickly point escaped
    float smoothColor;
    
    if (colorMode == 0) {
      // Smooth coloring formula
      float logZn = log(dot(z, z)) / 2.0;
      float nu = log(logZn / LOG2) / LOG2;
      smoothColor = float(i) + 1.0 - nu;
    } else if (colorMode == 1) {
      // Band coloring
      smoothColor = float(i);
    } else {
      // Histogram-like coloring
      float logZn = log(dot(z, z)) / 2.0;
      smoothColor = float(i) + 1.0 - log(log(bailout) / logZn) / LOG2;
    }
    
    // Normalize and apply color cycles
    float t = smoothColor / float(iterations);
    t = pow(t, 0.5); // Apply gamma for better color distribution
    t = fract(t * colorCycles + colorShift);
    
    // Get color from palette
    vec3 color = paletteColor(t);
    
    // Apply audio-reactive effects
    if (audioMid > 0.6) {
      // Pulse with mid frequencies
      color += vec3(0.1, 0.1, 0.2) * sin(time * 5.0) * audioMid;
    }
    
    // Apply treble for highlights
    if (audioTreble > 0.7) {
      float highlight = pow(1.0 - t, 5.0) * audioTreble;
      color += vec3(highlight);
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
}