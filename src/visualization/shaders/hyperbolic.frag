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

// Hyperbolic parameters
uniform int p;                // Number of sides of the polygon (3=triangle, 4=square, etc.)
uniform int q;                // Number of polygons meeting at each vertex
uniform float depth;          // Maximum recursion depth for the tiling

// Color parameters
uniform int colorMode;        // 0: distance-based, 1: iteration-based, 2: coordinate-based
uniform float colorCycles;    // Number of color cycles
uniform vec3 palette[8];      // Color palette with 8 colors

// Audio reactivity
uniform float audioVolume;    // Overall volume (0-1)
uniform float audioBass;      // Bass level (0-1)
uniform float audioMid;       // Mid frequencies (0-1)
uniform float audioTreble;    // Treble level (0-1)

// Varyings from vertex shader
varying vec2 vUv;

// Constants
const float PI = 3.14159265359;
const float EPSILON = 0.0001;

// Poincaré disk model utilities
struct Complex {
    float re;
    float im;
};

// Complex number operations
Complex complexAdd(Complex a, Complex b) {
    return Complex(a.re + b.re, a.im + b.im);
}

Complex complexMul(Complex a, Complex b) {
    return Complex(
        a.re * b.re - a.im * b.im,
        a.re * b.im + a.im * b.re
    );
}

Complex complexDiv(Complex a, Complex b) {
    float denom = b.re * b.re + b.im * b.im;
    return Complex(
        (a.re * b.re + a.im * b.im) / denom,
        (a.im * b.re - a.re * b.im) / denom
    );
}

// Complex conjugate
Complex complexConj(Complex z) {
    return Complex(z.re, -z.im);
}

// Complex absolute value squared
float complexAbsSq(Complex z) {
    return z.re * z.re + z.im * z.im;
}

// Möbius transformation
Complex mobius(Complex z, Complex a) {
    // w = (z - a) / (1 - conj(a) * z)
    Complex numerator = complexAdd(z, Complex(-a.re, -a.im));
    Complex denominator = complexAdd(Complex(1.0, 0.0), 
                                    complexMul(Complex(-a.re, a.im), z));
    return complexDiv(numerator, denominator);
}

// Reflection across a geodesic
Complex reflect(Complex z, Complex a, Complex b) {
    // Reflect z across the geodesic through a and b
    // First transform to make the geodesic a diameter
    Complex c = mobius(a, b);
    Complex zPrime = mobius(z, b);
    
    // Reflect across the real axis
    zPrime.im = -zPrime.im;
    
    // Transform back
    Complex bConj = complexConj(b);
    zPrime = mobius(zPrime, bConj);
    
    return zPrime;
}

// Distance in the Poincaré disk
float hyperbolicDistance(Complex z1, Complex z2) {
    float d = 2.0 * atanh(
        length(
            complexDiv(
                complexAdd(z1, Complex(-z2.re, -z2.im)), 
                complexAdd(Complex(1.0, 0.0), 
                          complexMul(z1, complexConj(z2)))
            )
        )
    );
    return d;
}

// Check if a point is inside a polygon
bool isInPolygon(Complex z, Complex polygon[20], int sides) {
    // Transform z to make the polygon regular and centered at origin
    Complex center = Complex(0.0, 0.0);
    for (int i = 0; i < 20; i++) {
        if (i < sides) {
            center = complexAdd(center, polygon[i]);
        }
    }
    center = Complex(center.re / float(sides), center.im / float(sides));
    
    Complex zPrime = complexAdd(z, Complex(-center.re, -center.im));
    
    // Check if point is on the same side of all edges
    bool inside = true;
    for (int i = 0; i < 20; i++) {
        if (i >= sides) break;
        
        int j = (i + 1) % sides;
        Complex a = complexAdd(polygon[i], Complex(-center.re, -center.im));
        Complex b = complexAdd(polygon[j], Complex(-center.re, -center.im));
        
        // Cross product to determine side
        float cross = (zPrime.re - a.re) * (b.im - a.im) - (zPrime.im - a.im) * (b.re - a.re);
        
        if (i == 0) {
            inside = cross > 0.0;
        } else if (inside != (cross > 0.0)) {
            inside = false;
            break;
        }
    }
    
    return inside;
}

// Generate hyperbolic tiling
vec3 generateTiling(Complex z) {
    // Adjust p and q based on audio if reactive
    int tileP = p;
    int tileQ = q;
    
    if (audioMid > 0.5) {
        float pMod = floor(audioMid * 2.0);
        tileP = max(3, p + int(pMod));
    }
    
    if (audioBass > 0.6) {
        float qMod = floor(audioBass * 2.0);
        tileQ = max(3, q + int(qMod));
    }
    
    // Calculate angles
    float angleP = PI / float(tileP);
    float angleQ = PI / float(tileQ);
    
    // Check if hyperbolic (sum of angles < PI)
    if (angleP + angleQ >= PI/2.0) {
        // Fall back to simpler pattern for non-hyperbolic cases
        return vec3(
            0.5 + 0.5 * sin(atan(z.im, z.re) * float(tileP) + time),
            0.5 + 0.5 * cos(length(z) * 10.0 * float(tileQ) + time * 0.5),
            0.5 + 0.5 * sin(length(z) * 5.0 + time * 0.3)
        );
    }
    
    // Generate the fundamental polygon (center is origin)
    Complex polygon[20]; // Max 20 sides
    for (int i = 0; i < 20; i++) {
        if (i >= tileP) break;
        
        float angle = float(i) * 2.0 * PI / float(tileP) + rotationAngle;
        polygon[i] = Complex(cos(angle), sin(angle));
        
        // Scale by a factor based on p and q
        float scale = cos(PI / float(tileP)) / cos(PI / float(tileQ));
        polygon[i].re *= scale;
        polygon[i].im *= scale;
    }
    
    // Check if the point is in the fundamental polygon
    if (isInPolygon(z, polygon, tileP)) {
        // Distance from center for coloring
        float dist = hyperbolicDistance(z, Complex(0.0, 0.0));
        
        if (colorMode == 0) {
            // Distance-based coloring
            float t = fract(dist * colorCycles * 0.1 + colorShift);
            return mix(palette[0], palette[1], t);
        } else {
            // Coordinate-based coloring
            float angle = atan(z.im, z.re);
            float t = fract(angle / (2.0 * PI) + colorShift);
            return mix(palette[2], palette[3], t);
        }
    }
    
    // Iterate through reflections to find the equivalent point in the fundamental domain
    Complex w = z;
    int iter = 0;
    float minDist = 1000.0;
    int closestEdge = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= iterations) break;
        
        // Find the closest edge
        minDist = 1000.0;
        closestEdge = 0;
        
        for (int j = 0; j < 20; j++) {
            if (j >= tileP) break;
            
            int k = (j + 1) % tileP;
            float distToEdge = hyperbolicDistance(w, complexAdd(
                Complex(polygon[j].re * 0.5 + polygon[k].re * 0.5, 
                       polygon[j].im * 0.5 + polygon[k].im * 0.5),
                Complex(0.0, 0.0)
            ));
            
            if (distToEdge < minDist) {
                minDist = distToEdge;
                closestEdge = j;
            }
        }
        
        // Reflect across the closest edge
        int k = (closestEdge + 1) % tileP;
        w = reflect(w, polygon[closestEdge], polygon[k]);
        
        if (isInPolygon(w, polygon, tileP)) {
            iter = i + 1;
            break;
        }
    }
    
    // Color based on iterations and distance
    if (colorMode == 1) {
        // Iteration-based coloring
        float t = float(iter) / depth;
        t = fract(t * colorCycles + colorShift);
        
        int idx = int(t * 7.0);
        float fract_t = fract(t * 7.0);
        
        return mix(palette[idx], palette[idx + 1], fract_t);
    } else {
        // Mixed coloring
        float dist = hyperbolicDistance(w, Complex(0.0, 0.0));
        float angle = atan(w.im, w.re);
        
        float t1 = fract(dist * 2.0 + colorShift);
        float t2 = fract(angle / (2.0 * PI) + time * 0.1);
        
        return mix(
            mix(palette[4], palette[5], t1),
            mix(palette[6], palette[7], t2),
            0.5 + 0.5 * sin(time * 0.2)
        );
    }
}

// Interpolate between colors in the palette
vec3 paletteColor(float t) {
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
    float s = sin(rotationAngle);
    float c = cos(rotationAngle);
    vec2 rotatedUv = vec2(
        uv.x * c - uv.y * s,
        uv.x * s + uv.y * c
    );
    
    // Apply zoom and center
    vec2 z = rotatedUv / zoom + vec2(centerX, centerY);
    
    // Scale to fit in the Poincaré disk
    float disk_radius = 0.9; // Keep inside unit disk
    z *= disk_radius;
    
    // Audio-reactive distortion
    if (audioBass > 0.5) {
        float distortion = audioBass * 0.05;
        z += vec2(
            sin(z.y * 10.0 + time) * distortion,
            cos(z.x * 10.0 + time) * distortion
        );
    }
    
    // Check if point is inside the Poincaré disk
    float dist = length(z);
    if (dist >= 1.0) {
        // Outside the disk - black background
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    // Generate tiling
    Complex zComplex = Complex(z.x, z.y);
    vec3 color = generateTiling(zComplex);
    
    // Apply audio-reactive effects
    if (audioMid > 0.6) {
        // Pulse with mid frequencies
        color += vec3(0.1, 0.1, 0.2) * sin(time * 5.0) * audioMid;
    }
    
    // Apply treble for highlights near the boundary
    if (audioTreble > 0.7) {
        float boundary = smoothstep(0.75, 1.0, dist);
        float highlight = boundary * audioTreble;
        color += vec3(highlight * 0.5);
    }
    
    // Darken near the boundary to emphasize the disk
    float boundaryDarken = smoothstep(0.85, 0.99, dist);
    color *= 1.0 - boundaryDarken * 0.7;
    
    gl_FragColor = vec4(color, 1.0);
}