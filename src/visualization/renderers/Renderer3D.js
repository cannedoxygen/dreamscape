/**
 * Renderer3D.js
 * 
 * A WebGL-based renderer for 3D fractals using ray marching.
 * Handles the rendering of Mandelbulb and other 3D fractals.
 */

import * as THREE from 'three';
import { Performance } from '../../utils/Performance';

export class Renderer3D {
  /**
   * Create a new 3D renderer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.scene = options.scene;
    this.camera = options.camera;
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
    
    // Uniforms for the shader
    this.uniforms = {
      resolution: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 },
      
      // Camera uniforms
      cameraPosition: { value: new THREE.Vector3(2, 2, 4) },
      cameraTarget: { value: new THREE.Vector3(0, 0, 0) },
      cameraFov: { value: 45.0 },
      
      // Fractal parameters
      power: { value: 8.0 },         // Mandelbulb power parameter
      maxIterations: { value: 10 },  // Maximum iterations (keep low for performance)
      bailout: { value: 2.0 },       // Escape radius
      colorShift: { value: 0.0 },    // Color cycling shift
      detail: { value: 1.0 },        // Detail level (affects ray step size)
      
      // Color parameters
      colorMode: { value: 1 },       // 0: normal-based, 1: iteration-based, 2: distance-based
      palette: { value: [            // 8 colors for the palette
        new THREE.Vector3(0.0, 0.0, 0.0),    // Black
        new THREE.Vector3(0.1, 0.1, 0.3),    // Deep blue
        new THREE.Vector3(0.1, 0.3, 0.6),    // Blue
        new THREE.Vector3(0.0, 0.5, 0.8),    // Light blue
        new THREE.Vector3(0.0, 0.8, 0.6),    // Teal
        new THREE.Vector3(0.0, 0.6, 0.3),    // Green
        new THREE.Vector3(0.4, 0.2, 0.6),    // Purple
        new THREE.Vector3(0.6, 0.0, 0.4)     // Magenta
      ]},
      
      // Lighting parameters
      lightPosition: { value: new THREE.Vector3(4, 4, 4) },
      lightColor: { value: new THREE.Vector3(1, 1, 1) },
      ambientStrength: { value: 0.2 },
      specularStrength: { value: 0.5 },
      
      // Audio reactivity
      audioVolume: { value: 0.0 },
      audioBass: { value: 0.0 },
      audioMid: { value: 0.0 },
      audioTreble: { value: 0.0 }
    };
    
    // Animation properties
    this.rotationSpeed = 0.1;
    this.orbitRadius = 4.0;
    this.orbitHeight = 1.5;
    
    // Set initial configuration
    this.updateFromConfig();
  }
  
  /**
   * Initialize the renderer
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark(`renderer3d-${this.name}-init-start`);
    
    // Create a scene for the fullscreen quad if not provided
    if (!this.scene) {
      this.scene = new THREE.Scene();
    }
    
    // Create a camera if not provided
    if (!this.camera) {
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      this.camera.position.z = 1;
    }
    
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
    
    Performance.mark(`renderer3d-${this.name}-init-end`);
    Performance.measure(
      `renderer3d-${this.name}-initialization`, 
      `renderer3d-${this.name}-init-start`, 
      `renderer3d-${this.name}-init-end`
    );
    
    console.log(`Renderer3D '${this.name}' initialized`);
    return Promise.resolve();
  }
  
  /**
   * Update renderer from configuration
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Apply configuration to uniforms
    if (this.config.power !== undefined) this.uniforms.power.value = this.config.power;
    if (this.config.maxIterations !== undefined) this.uniforms.maxIterations.value = this.config.maxIterations;
    if (this.config.bailout !== undefined) this.uniforms.bailout.value = this.config.bailout;
    if (this.config.colorShift !== undefined) this.uniforms.colorShift.value = this.config.colorShift;
    if (this.config.detail !== undefined) this.uniforms.detail.value = this.config.detail;
    if (this.config.colorMode !== undefined) this.uniforms.colorMode.value = this.config.colorMode;
    if (this.config.ambientStrength !== undefined) this.uniforms.ambientStrength.value = this.config.ambientStrength;
    if (this.config.specularStrength !== undefined) this.uniforms.specularStrength.value = this.config.specularStrength;
    
    // Apply palette if provided
    if (this.config.palette && Array.isArray(this.config.palette) && this.config.palette.length === 8) {
      for (let i = 0; i < 8; i++) {
        const color = this.config.palette[i];
        if (color && color.length === 3) {
          this.uniforms.palette.value[i].set(color[0], color[1], color[2]);
        }
      }
    }
    
    // Apply camera configuration
    if (this.config.cameraFov !== undefined) this.uniforms.cameraFov.value = this.config.cameraFov;
    if (this.config.orbitRadius !== undefined) this.orbitRadius = this.config.orbitRadius;
    if (this.config.orbitHeight !== undefined) this.orbitHeight = this.config.orbitHeight;
    if (this.config.rotationSpeed !== undefined) this.rotationSpeed = this.config.rotationSpeed;
  }
  
  /**
   * Update renderer with parameters
   * @param {Object} parameters - Parameters to update
   */
  update(parameters = {}) {
    if (!this.initialized) return;
    
    // Update time
    this.uniforms.time.value = performance.now() * 0.001;
    
    // Update camera position - orbit around center
    const time = this.uniforms.time.value * this.rotationSpeed;
    this.uniforms.cameraPosition.value.x = Math.sin(time) * this.orbitRadius;
    this.uniforms.cameraPosition.value.z = Math.cos(time) * this.orbitRadius;
    this.uniforms.cameraPosition.value.y = this.orbitHeight + Math.sin(time * 0.5) * 0.5;
    
    // Update fractal parameters
    if (parameters.colorShift !== undefined) this.uniforms.colorShift.value = parameters.colorShift;
    if (parameters.iterations !== undefined) this.uniforms.maxIterations.value = parameters.iterations;
    
    // Update audio reactivity parameters
    if (parameters.audioData) {
      this.uniforms.audioVolume.value = parameters.audioData.volume || 0;
      this.uniforms.audioBass.value = parameters.audioData.bass || 0;
      this.uniforms.audioMid.value = parameters.audioData.mid || 0;
      this.uniforms.audioTreble.value = parameters.audioData.treble || 0;
      
      // Adjust detail level based on device performance and audio
      if (parameters.quality !== undefined) {
        const baseDetail = 1.0 * parameters.quality;
        
        // Reduce detail during intense audio moments for better performance
        if (parameters.audioData.volume > 0.8) {
          this.uniforms.detail.value = baseDetail * 0.7;
        } else {
          this.uniforms.detail.value = baseDetail;
        }
      }
    }
  }
  
  /**
   * Render the fractal
   */
  render() {
    if (!this.initialized || !this.threeRenderer) return;
    
    Performance.startMeasure(`render3d-${this.name}`);
    this.threeRenderer.render(this.scene, this.camera);
    Performance.endMeasure(`render3d-${this.name}`);
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
   * Set camera parameters
   * @param {Object} params - Camera parameters
   */
  setCamera(params = {}) {
    if (params.position && params.position.length === 3) {
      this.uniforms.cameraPosition.value.set(
        params.position[0],
        params.position[1],
        params.position[2]
      );
    }
    
    if (params.target && params.target.length === 3) {
      this.uniforms.cameraTarget.value.set(
        params.target[0],
        params.target[1],
        params.target[2]
      );
    }
    
    if (params.fov !== undefined) {
      this.uniforms.cameraFov.value = params.fov;
    }
  }
  
  /**
   * Adjust quality based on device capabilities
   * @param {number} qualityMultiplier - Quality multiplier (0.5 to 2.0)
   */
  adjustQuality(qualityMultiplier) {
    const baseIterations = 8;
    this.uniforms.maxIterations.value = Math.max(
      4,
      Math.floor(baseIterations * qualityMultiplier)
    );
    
    this.uniforms.detail.value = qualityMultiplier;
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

export default Renderer3D;