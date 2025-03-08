precision highp float;

// Import common functions
#include "./common.glsl"

// Common uniforms
uniform vec2 resolution;      // Viewport resolution (width, height)
uniform float time;           // Shader playback time (in seconds)

// Camera/view uniforms
uniform vec3 cameraPosition;  // Camera position in 3D space
uniform vec3 cameraTarget;    // Camera look-at target
uniform float cameraFov;      // Field of view in degrees

// Fractal parameters
uniform float power;          // Mandelbulb power parameter (typically 8.0)
uniform int maxIterations;    // Maximum number of iterations
uniform float bailout;        // Escape radius
uniform float colorShift;     // Color cycling shift
uniform float detail;         // Detail level (affects ray step size)

// Color parameters
uniform int colorMode;        // 0: normal-based, 1: iteration-based, 2: distance-based
uniform vec3 palette[8];      // Color palette with 8 colors

// Lighting parameters
uniform vec3 lightPosition;   // Main light position
uniform vec3 lightColor;      // Main light color
uniform float ambientStrength; // Ambient light strength
uniform float specularStrength; // Specular highlight strength

// Audio reactivity
uniform float audioVolume;    // Overall volume (0-1)
uniform float audioBass;      // Bass level (0-1)
uniform float audioMid;       // Mid frequencies (0-1)
uniform float audioTreble;    // Treble level (0-1)

// Output varyings
varying vec2 vUv;

// Constants for ray marching
const float MIN_DIST = 0.001;
const float MAX_DIST = 50.0;
const float EPSILON = 0.0001;

// Mandelbulb distance estimation function
float mandelbulbDE(vec3 pos) {
    // Apply audio-reactive modulation
    float p = power;
    if (audioBass > 0.5) {
        p += audioBass * 2.0 * sin(time * 2.0);
    }
    
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIterations) break;
        
        // Convert to polar coordinates
        r = length(z);
        
        // Escape radius check
        if (r > bailout) break;
        
        // Convert to polar coordinates
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        dr = pow(r, p - 1.0) * p * dr + 1.0;
        
        // Scale and rotate the point
        float zr = pow(r, p);
        theta = theta * p;
        phi = phi * p;
        
        // Convert back to cartesian coordinates
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        
        // Add original position
        z += pos;
        
        // Apply audio-reactive distortion
        if (audioMid > 0.6) {
            float distAmt = audioMid * 0.1;
            z.x += sin(z.z * 5.0 + time) * distAmt;
            z.y += sin(z.x * 5.0 + time) * distAmt;
            z.z += sin(z.y * 5.0 + time) * distAmt;
        }
    }
    
    // Distance estimation: 0.5 * log(r) * r / dr
    return 0.5 * log(r) * r / dr;
}

// Calculate surface normal
vec3 calculateNormal(vec3 p) {
    float h = EPSILON;
    vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * mandelbulbDE(p + k.xyy * h) +
        k.yxy * mandelbulbDE(p + k.yxy * h) +
        k.yyx * mandelbulbDE(p + k.yyx * h) +
        k.xxx * mandelbulbDE(p + k.xxx * h)
    );
}

// Ray marching function
vec4 rayMarch(vec3 rayOrigin, vec3 rayDir) {
    float t = 0.0;
    float iteration = 0.0;
    
    // Adjust detail level based on performance needs
    float stepFactor = 1.0 / detail;
    
    for (int i = 0; i < 300; i++) {
        if (i >= 300) break; // Shader loop limit safety
        
        vec3 p = rayOrigin + rayDir * t;
        float d = mandelbulbDE(p);
        
        // Count iterations for coloring
        iteration += 1.0;
        
        // If hit surface or reached max distance
        if (d < MIN_DIST || t > MAX_DIST) break;
        
        // Adjust step size based on distance and detail level
        t += d * stepFactor;
    }
    
    // Return hit data: xyz = position, w = iteration count
    return vec4(rayOrigin + rayDir * t, iteration);
}

// Lighting calculation
vec3 calculateLighting(vec3 p, vec3 normal, vec3 viewDir, vec3 color) {
    // Normalize light direction
    vec3 lightDir = normalize(lightPosition - p);
    
    // Ambient component
    vec3 ambient = ambientStrength * lightColor;
    
    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;
    
    // Specular component
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * lightColor;
    
    // Audio-reactive lighting
    if (audioTreble > 0.7) {
        // Add pulsing rim light when treble is high
        float rim = 1.0 - max(dot(viewDir, normal), 0.0);
        rim = pow(rim, 4.0) * audioTreble;
        specular += rim * vec3(1.0, 0.7, 0.5) * audioTreble;
    }
    
    return color * (ambient + diffuse) + specular;
}

void main() {
    // Normalize coordinates
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y; // Aspect ratio correction
    
    // Set up camera
    vec3 ro = cameraPosition;
    vec3 target = cameraTarget;
    
    // Apply slight camera movement based on audio
    if (audioVolume > 0.5) {
        ro.x += sin(time * 0.5) * audioVolume * 0.2;
        ro.y += cos(time * 0.7) * audioVolume * 0.1;
    }
    
    // Camera basis vectors
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    
    // Perspective projection
    float fov = radians(cameraFov);
    vec3 rd = normalize(forward + uv.x * right * tan(fov/2.0) + uv.y * up * tan(fov/2.0));
    
    // Ray march to get hit position and iteration count
    vec4 hit = rayMarch(ro, rd);
    vec3 p = hit.xyz;
    float iterations = hit.w;
    
    // Check if we hit the fractal
    if (length(p - ro) < MAX_DIST) {
        // Calculate normal
        vec3 normal = calculateNormal(p);
        
        // Determine base color based on selected mode
        vec3 color;
        
        if (colorMode == 0) {
            // Color based on normals
            color = 0.5 + 0.5 * normal;
        } else if (colorMode == 1) {
            // Color based on iteration count
            float t = iterations / float(maxIterations);
            t = pow(t, 0.5); // Gamma correction for better distribution
            t = fract(t * 3.0 + colorShift); // Color cycling
            color = paletteColor(t, palette);
        } else {
            // Color based on position/distance
            float dist = length(p);
            float t = fract(dist * 0.1 + colorShift);
            color = paletteColor(t, palette);
        }
        
        // Apply lighting
        color = calculateLighting(p, normal, -rd, color);
        
        // Set output color
        gl_FragColor = vec4(color, 1.0);
    } else {
        // Background color (space/sky)
        vec3 bgColor = vec3(0.01, 0.01, 0.04); // Deep space blue
        
        // Add some stars
        vec2 seed = vUv * 500.0;
        float starField = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
        starField = step(0.997, starField) * pow(starField, 5.0);
        
        // Subtle nebula based on position
        vec3 nebulaColor = paletteColor(fract(uv.x * 0.2 + uv.y * 0.3 + time * 0.01), palette);
        float nebulaMask = smoothstep(0.3, 0.9, 0.5 + 0.5 * sin(uv.x * 2.0) * sin(uv.y * 2.0 + time * 0.1));
        nebulaMask *= 0.15; // Reduce intensity
        
        // Combine background elements
        bgColor += starField;
        bgColor += nebulaColor * nebulaMask;
        
        gl_FragColor = vec4(bgColor, 1.0);
    }
}