/**
 * Renderer2D.js
 * 
 * A WebGL-based renderer for 2D fractals using custom shaders.
 * Handles the core rendering of Mandelbrot, Julia, and other 2D fractals.
 */

import * as THREE from 'three';
import { Performance } from '../../utils/Performance';

export class Renderer2D {
  /**
   * Create a new 2D renderer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.threeRenderer = options.renderer;
    this.fragmentShader = options.fragmentShader || '';
    this.config = options.config || {};
    this.initialized = false;
    
    // Default vertex shader (simple fullscreen quad)
    this.vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
    
    // If no fragment shader provided, use a default
    if (!this.fragmentShader) {
      this.fragmentShader = `
        precision highp float;
        
        uniform vec2 resolution;
        uniform float time;
        
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float intensity = 0.5 + 0.5 * sin(time + 10.0 * (uv.x * uv.y));
          gl_FragColor = vec4(intensity * vec3(0.0, 0.5, 1.0), 1.0);
        }
      `;
    }
    
    // Uniforms for the shader
    this.uniforms = {
      resolution: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 },
      
      // Fractal specific uniforms
      centerX: { value: 0.0 },
      centerY: { value: 0.0 },
      zoom: { value: 1.0 },
      iterations: { value: 100 },
      colorShift: { value: 0.0 },
      rotationAngle: { value: 0.0 },
      
      // Julia set specific
      juliaReal: { value: -0.7 },
      juliaImag: { value: 0.27 },
      
      // General math parameters
      exponent: { value: 2.0 },     // Power in the fractal formula (z^exponent + c)
      bailout: { value: 4.0 },      // Escape radius squared
      
      // Color parameters
      colorMode: { value: 0 },      // 0: smooth, 1: bands, 2: hue cycle
      colorCycles: { value: 3.0 },  // Number of color cycles in the gradient
      palette: { value: [           // 8 colors for the palette
        new THREE.Vector3(0.0, 0.0, 0.0),    // Black
        new THREE.Vector3(0.1, 0.3, 0.6),    // Deep blue
        new THREE.Vector3(0.1, 0.5, 0.9),    // Blue
        new THREE.Vector3(0.0, 0.8, 1.0),    // Cyan
        new THREE.Vector3(0.0, 1.0, 0.4),    // Green-cyan
        new THREE.Vector3(1.0, 1.0, 0.0),    // Yellow
        new THREE.Vector3(1.0, 0.6, 0.0),    // Orange
        new THREE.Vector3(1.0, 0.0, 0.0)     // Red
      ]},
      
      // Audio reactivity
      audioVolume: { value: 0.0 },
      audioBass: { value: 0.0 },
      audioMid: { value: 0.0 },
      audioTreble: { value: 0.0 },
      
      // Animation/transition parameters
      transitionProgress: { value: 0.0 },
      previousCenterX: { value: 0.0 },
      previousCenterY: { value: 0.0 },
      previousZoom: { value: 1.0 }
    };
    
    // Set initial configuration
    this.updateFromConfig();
  }
  
  /**
   * Initialize the renderer
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark(`renderer-${this.name}-init-start`);
    
    // Create a scene for the fullscreen quad
    this.scene = new THREE.Scene();
    
    // Create a camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;
    
    // Create a fullscreen quad
    this.geometry = new THREE.PlaneGeometry(2, 2);
    
    // Create the shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      depthTest: false,
      depthWrite: false
    });
    
    // Create the mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    
    // Set initial size
    if (this.threeRenderer) {
      const size = this.threeRenderer.getSize(new THREE.Vector2());
      this.setSize(size.x, size.y);
    }
    
    this.initialized = true;
    
    Performance.mark(`renderer-${this.name}-init-end`);
    Performance.measure(
      `renderer-${this.name}-initialization`, 
      `renderer-${this.name}-init-start`, 
      `renderer-${this.name}-init-end`
    );
    
    console.log(`Renderer2D '${this.name}' initialized`);
    return Promise.resolve();
  }
  
  /**
   * Update renderer from configuration
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Apply configuration to uniforms
    if (this.config.centerX !== undefined) this.uniforms.centerX.value = this.config.centerX;
    if (this.config.centerY !== undefined) this.uniforms.centerY.value = this.config.centerY;
    if (this.config.zoom !== undefined) this.uniforms.zoom.value = this.config.zoom;
    if (this.config.iterations !== undefined) this.uniforms.iterations.value = this.config.iterations;
    if (this.config.colorShift !== undefined) this.uniforms.colorShift.value = this.config.colorShift;
    if (this.config.rotationAngle !== undefined) this.uniforms.rotationAngle.value = this.config.rotationAngle;
    if (this.config.juliaReal !== undefined) this.uniforms.juliaReal.value = this.config.juliaReal;
    if (this.config.juliaImag !== undefined) this.uniforms.juliaImag.value = this.config.juliaImag;
    if (this.config.exponent !== undefined) this.uniforms.exponent.value = this.config.exponent;
    if (this.config.bailout !== undefined) this.uniforms.bailout.value = this.config.bailout;
    if (this.config.colorMode !== undefined) this.uniforms.colorMode.value = this.config.colorMode;
    if (this.config.colorCycles !== undefined) this.uniforms.colorCycles.value = this.config.colorCycles;
    
    // Apply palette if provided
    if (this.config.palette && Array.isArray(this.config.palette) && this.config.palette.length === 8) {
      for (let i = 0; i < 8; i++) {
        const color = this.config.palette[i];
        if (color && color.length === 3) {
          this.uniforms.palette.value[i].set(color[0], color[1], color[2]);
        }
      }
    }
  }
  
  /**
   * Update renderer with parameters
   * @param {Object} parameters - Parameters to update
   */
  update(parameters = {}) {
    if (!this.initialized) return;
    
    // Update time
    this.uniforms.time.value = performance.now() * 0.001;
    
    // Update fractal parameters
    if (parameters.centerX !== undefined) this.uniforms.centerX.value = parameters.centerX;
    if (parameters.centerY !== undefined) this.uniforms.centerY.value = parameters.centerY;
    if (parameters.zoom !== undefined) this.uniforms.zoom.value = parameters.zoom;
    if (parameters.iterations !== undefined) this.uniforms.iterations.value = parameters.iterations;
    if (parameters.colorShift !== undefined) this.uniforms.colorShift.value = parameters.colorShift;
    if (parameters.rotationAngle !== undefined) this.uniforms.rotationAngle.value = parameters.rotationAngle;
    if (parameters.juliaReal !== undefined) this.uniforms.juliaReal.value = parameters.juliaReal;
    if (parameters.juliaImag !== undefined) this.uniforms.juliaImag.value = parameters.juliaImag;
    if (parameters.exponent !== undefined) this.uniforms.exponent.value = parameters.exponent;
    if (parameters.bailout !== undefined) this.uniforms.bailout.value = parameters.bailout;
    
    // Update audio reactivity parameters
    if (parameters.audioData) {
      this.uniforms.audioVolume.value = parameters.audioData.volume || 0;
      this.uniforms.audioBass.value = parameters.audioData.bass || 0;
      this.uniforms.audioMid.value = parameters.audioData.mid || 0;
      this.uniforms.audioTreble.value = parameters.audioData.treble || 0;
    }
  }
  
  /**
   * Render the fractal
   */
  render() {
    if (!this.initialized || !this.threeRenderer) return;
    
    Performance.startMeasure(`render-${this.name}`);
    this.threeRenderer.render(this.scene, this.camera);
    Performance.endMeasure(`render-${this.name}`);
  }
  
  /**
   * Set renderer size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setSize(width, height) {
    if (!this.initialized) return;
    
    this.uniforms.resolution.value.set(width, height);
  }
  
  /**
   * Set renderer parameters
   * @param {Object} params - Parameters object
   */
  setParameters(params = {}) {
    Object.entries(params).forEach(([key, value]) => {
      if (this.uniforms[key] !== undefined) {
        this.uniforms[key].value = value;
      }
    });
  }
  
  /**
   * Set palette colors
   * @param {Array} colors - Array of RGB color arrays
   */
  setPalette(colors) {
    if (!Array.isArray(colors) || colors.length !== 8) {
      console.error('Palette must be an array of 8 colors');
      return;
    }
    
    for (let i = 0; i < 8; i++) {
      const color = colors[i];
      if (Array.isArray(color) && color.length === 3) {
        this.uniforms.palette.value[i].set(color[0], color[1], color[2]);
      }
    }
  }
  
  /**
   * Start a transition to new parameters
   * @param {Object} targetParams - Target parameters
   * @param {number} duration - Transition duration in seconds
   * @returns {Promise} - Resolves when transition completes
   */
  transition(targetParams, duration = 2.0) {
    return new Promise((resolve) => {
      // Save current parameters as previous
      this.uniforms.previousCenterX.value = this.uniforms.centerX.value;
      this.uniforms.previousCenterY.value = this.uniforms.centerY.value;
      this.uniforms.previousZoom.value = this.uniforms.zoom.value;
      
      // Reset transition progress
      this.uniforms.transitionProgress.value = 0.0;
      
      // Create animation
      const startTime = performance.now();
      const endTime = startTime + (duration * 1000);
      
      const animate = () => {
        const now = performance.now();
        const progress = Math.min(1.0, (now - startTime) / (endTime - startTime));
        
        // Update transition progress
        this.uniforms.transitionProgress.value = progress;
        
        // Linear interpolation for parameters
        if (targetParams.centerX !== undefined) {
          this.uniforms.centerX.value = this.uniforms.previousCenterX.value + (targetParams.centerX - this.uniforms.previousCenterX.value) * progress;
        }
        
        if (targetParams.centerY !== undefined) {
          this.uniforms.centerY.value = this.uniforms.previousCenterY.value + (targetParams.centerY - this.uniforms.previousCenterY.value) * progress;
        }
        
        if (targetParams.zoom !== undefined) {
          // Logarithmic interpolation for zoom
          const startZoom = Math.log(this.uniforms.previousZoom.value);
          const endZoom = Math.log(targetParams.zoom);
          this.uniforms.zoom.value = Math.exp(startZoom + (endZoom - startZoom) * progress);
        }
        
        // Continue animation if not complete
        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          // Apply final parameters directly to ensure precision
          if (targetParams.centerX !== undefined) this.uniforms.centerX.value = targetParams.centerX;
          if (targetParams.centerY !== undefined) this.uniforms.centerY.value = targetParams.centerY;
          if (targetParams.zoom !== undefined) this.uniforms.zoom.value = targetParams.zoom;
          
          resolve();
        }
      };
      
      // Start animation
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Convert screen coordinates to fractal coordinates
   * @param {number} screenX - X coordinate in pixels
   * @param {number} screenY - Y coordinate in pixels
   * @returns {Object} - Fractal coordinates {x, y}
   */
  screenToFractalCoordinates(screenX, screenY) {
    const width = this.uniforms.resolution.value.x;
    const height = this.uniforms.resolution.value.y;
    
    // Convert to normalized coordinates (-1 to 1)
    const normalizedX = (screenX / width) * 2 - 1;
    const normalizedY = ((height - screenY) / height) * 2 - 1;
    
    // Adjust for aspect ratio
    const aspect = width / height;
    let x = normalizedX;
    let y = normalizedY;
    
    if (aspect > 1) {
      x *= aspect;
    } else {
      y /= aspect;
    }
    
    // Apply rotation if needed
    if (this.uniforms.rotationAngle.value !== 0) {
      const angle = this.uniforms.rotationAngle.value;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }
    
    // Apply zoom and center
    x = x / this.uniforms.zoom.value + this.uniforms.centerX.value;
    y = y / this.uniforms.zoom.value + this.uniforms.centerY.value;
    
    return { x, y };
  }
  
  /**
   * Convert fractal coordinates to screen coordinates
   * @param {number} fractalX - X coordinate in fractal space
   * @param {number} fractalY - Y coordinate in fractal space
   * @returns {Object} - Screen coordinates {x, y}
   */
  fractalToScreenCoordinates(fractalX, fractalY) {
    const width = this.uniforms.resolution.value.x;
    const height = this.uniforms.resolution.value.y;
    const aspect = width / height;
    
    // Apply center and zoom
    let x = (fractalX - this.uniforms.centerX.value) * this.uniforms.zoom.value;
    let y = (fractalY - this.uniforms.centerY.value) * this.uniforms.zoom.value;
    
    // Apply rotation if needed
    if (this.uniforms.rotationAngle.value !== 0) {
      const angle = -this.uniforms.rotationAngle.value; // Inverse rotation
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      x = rotatedX;
      y = rotatedY;
    }
    
    // Adjust for aspect ratio
    if (aspect > 1) {
      x /= aspect;
    } else {
      y *= aspect;
    }
    
    // Convert to screen coordinates
    const screenX = ((x + 1) / 2) * width;
    const screenY = height - ((y + 1) / 2) * height;
    
    return { x: screenX, y: screenY };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    
    this.initialized = false;
  }
}

export default Renderer2D;