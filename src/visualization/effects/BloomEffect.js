/**
 * BloomEffect.js
 * 
 * Implements a bloom post-processing effect for fractal visualization.
 * Bloom adds a glow to bright areas of the image, creating a dreamy,
 * ethereal quality that enhances the visual impact of fractals.
 * 
 * Based on the three.js UnrealBloomPass, but optimized for use with
 * fractal rendering.
 */

import * as THREE from 'three';
import { Performance } from '../../utils/Performance';

// Vertex shader for the bloom effect
const BLOOM_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for brightness extraction
const BRIGHTNESS_EXTRACT_FRAGMENT = `
uniform sampler2D tDiffuse;
uniform float threshold;
uniform float intensity;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  float brightness = max(max(texel.r, texel.g), texel.b);
  float contribution = max(0.0, brightness - threshold);
  contribution *= intensity;
  gl_FragColor = texel * contribution;
}
`;

// Fragment shader for blur (horizontal)
const BLUR_HORIZONTAL_FRAGMENT = `
uniform sampler2D tDiffuse;
uniform float resolution;
uniform float radius;

varying vec2 vUv;

void main() {
  vec4 sum = vec4(0.0);
  float blurSize = radius / resolution;
  
  // Blur weights (Gaussian approximation)
  float weight[5];
  weight[0] = 0.227027;
  weight[1] = 0.1945946;
  weight[2] = 0.1216216;
  weight[3] = 0.054054;
  weight[4] = 0.016216;
  
  // Central sample
  sum += texture2D(tDiffuse, vUv) * weight[0];
  
  // Horizontal samples
  for (int i = 1; i < 5; i++) {
    sum += texture2D(tDiffuse, vUv + vec2(blurSize * float(i), 0.0)) * weight[i];
    sum += texture2D(tDiffuse, vUv - vec2(blurSize * float(i), 0.0)) * weight[i];
  }
  
  gl_FragColor = sum;
}
`;

// Fragment shader for blur (vertical)
const BLUR_VERTICAL_FRAGMENT = `
uniform sampler2D tDiffuse;
uniform float resolution;
uniform float radius;

varying vec2 vUv;

void main() {
  vec4 sum = vec4(0.0);
  float blurSize = radius / resolution;
  
  // Blur weights (Gaussian approximation)
  float weight[5];
  weight[0] = 0.227027;
  weight[1] = 0.1945946;
  weight[2] = 0.1216216;
  weight[3] = 0.054054;
  weight[4] = 0.016216;
  
  // Central sample
  sum += texture2D(tDiffuse, vUv) * weight[0];
  
  // Vertical samples
  for (int i = 1; i < 5; i++) {
    sum += texture2D(tDiffuse, vUv + vec2(0.0, blurSize * float(i))) * weight[i];
    sum += texture2D(tDiffuse, vUv - vec2(0.0, blurSize * float(i))) * weight[i];
  }
  
  gl_FragColor = sum;
}
`;

// Fragment shader for compositing bloom with original image
const COMPOSITE_FRAGMENT = `
uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float strength;

varying vec2 vUv;

void main() {
  vec4 original = texture2D(tDiffuse, vUv);
  vec4 bloom = texture2D(tBloom, vUv);
  
  // Simple additive blend with strength parameter
  gl_FragColor = original + bloom * strength;
}
`;

export class BloomEffect {
  /**
   * Initialize the bloom effect
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.camera = options.camera;
    this.config = options.config || {};
    this.extensions = options.extensions || {};
    
    // Effect parameters
    this.parameters = {
      enabled: this.config.enabled !== undefined ? this.config.enabled : true,
      strength: this.config.strength || 0.7, // Overall bloom strength
      threshold: this.config.threshold || 0.6, // Brightness threshold
      radius: this.config.radius || 0.4, // Blur radius
      resolution: this.config.resolution || 256, // Render target resolution
      kernelSize: this.config.kernelSize || 5, // Blur kernel size
      quality: this.config.quality || 'medium', // 'low', 'medium', 'high'
      passes: this.config.passes || 5 // Number of blur passes
    };
    
    // Set quality-based parameters
    this.setQualityParameters();
    
    // Render targets
    this.renderTargets = [];
    this.brightTarget = null;
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    
    // Materials
    this.brightPassMaterial = null;
    this.blurMaterialH = null;
    this.blurMaterialV = null;
    this.compositeMaterial = null;
    
    // Scene and camera for post-processing
    this.postScene = null;
    this.postCamera = null;
    
    // Initialized flag
    this.initialized = false;
    
    // Performance metrics
    this.metrics = {
      renderTime: 0,
      lastUpdateTime: 0
    };
  }
  
  /**
   * Initialize the bloom effect
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('bloom-init-start');
    
    try {
      console.log('Initializing Bloom Effect...');
      
      // Check WebGL capabilities
      this.checkCapabilities();
      
      // Create full-screen post-processing scene
      this.postScene = new THREE.Scene();
      this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.postQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        null
      );
      this.postScene.add(this.postQuad);
      
      // Initialize render targets
      await this.createRenderTargets();
      
      // Create materials
      this.createMaterials();
      
      this.initialized = true;
      
      Performance.mark('bloom-init-end');
      Performance.measure('bloom-initialization', 'bloom-init-start', 'bloom-init-end');
      
      console.log('Bloom Effect initialized', Performance.getLastMeasure('bloom-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Bloom Effect:', error);
      
      // Disable the effect if initialization fails
      this.parameters.enabled = false;
      return Promise.reject(error);
    }
  }
  
  /**
   * Check WebGL capabilities and adjust parameters if needed
   */
  checkCapabilities() {
    // Check if floating point textures are supported
    const hasFloatTextures = this.extensions.floatTextures;
    
    // Adjust parameters based on capabilities
    if (!hasFloatTextures) {
      console.warn('Bloom effect: Floating point textures not supported, reducing quality');
      this.parameters.quality = 'low';
      this.parameters.passes = 3;
      this.setQualityParameters();
    }
  }
  
  /**
   * Set parameters based on quality level
   */
  setQualityParameters() {
    const quality = this.parameters.quality;
    
    switch (quality) {
      case 'high':
        this.parameters.resolution = 512;
        this.parameters.passes = 5;
        break;
      case 'medium':
        this.parameters.resolution = 256;
        this.parameters.passes = 4;
        break;
      case 'low':
        this.parameters.resolution = 128;
        this.parameters.passes = 3;
        break;
    }
  }
  
  /**
   * Create the necessary render targets
   * @returns {Promise} - Resolves when render targets are created
   */
  async createRenderTargets() {
    // Get renderer size
    const size = this.renderer.getSize(new THREE.Vector2());
    const aspectRatio = size.x / size.y;
    
    // Target resolution
    const resolution = this.parameters.resolution;
    const width = Math.round(resolution * aspectRatio);
    const height = resolution;
    
    // Render target for brightness extraction
    this.brightTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    
    // Render targets for blur passes
    for (let i = 0; i < this.parameters.passes; i++) {
      // Calculate resolution for this pass (each pass is half size)
      const passWidth = Math.round(width / (2 ** i));
      const passHeight = Math.round(height / (2 ** i));
      
      // Horizontal blur target
      this.renderTargetsHorizontal.push(
        new THREE.WebGLRenderTarget(passWidth, passHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat
        })
      );
      
      // Vertical blur target
      this.renderTargetsVertical.push(
        new THREE.WebGLRenderTarget(passWidth, passHeight, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat
        })
      );
    }
    
    return Promise.resolve();
  }
  
  /**
   * Create the necessary materials
   */
  createMaterials() {
    // Brightness extraction material
    this.brightPassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        threshold: { value: this.parameters.threshold },
        intensity: { value: this.parameters.strength }
      },
      vertexShader: BLOOM_VERTEX_SHADER,
      fragmentShader: BRIGHTNESS_EXTRACT_FRAGMENT
    });
    
    // Horizontal blur material
    this.blurMaterialH = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: this.parameters.resolution },
        radius: { value: this.parameters.radius }
      },
      vertexShader: BLOOM_VERTEX_SHADER,
      fragmentShader: BLUR_HORIZONTAL_FRAGMENT
    });
    
    // Vertical blur material
    this.blurMaterialV = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: this.parameters.resolution },
        radius: { value: this.parameters.radius }
      },
      vertexShader: BLOOM_VERTEX_SHADER,
      fragmentShader: BLUR_VERTICAL_FRAGMENT
    });
    
    // Composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        strength: { value: this.parameters.strength }
      },
      vertexShader: BLOOM_VERTEX_SHADER,
      fragmentShader: COMPOSITE_FRAGMENT
    });
  }
  
  /**
   * Apply the bloom effect to the current render target
   * @param {Object} parameters - Fractal parameters
   */
  apply(parameters = {}) {
    if (!this.initialized || !this.parameters.enabled) return;
    
    Performance.startMeasure('bloom-apply');
    
    // Get the current render target
    const currentRenderTarget = this.renderer.getRenderTarget();
    
    // Extract bright areas
    this.postQuad.material = this.brightPassMaterial;
    this.brightPassMaterial.uniforms.tDiffuse.value = currentRenderTarget.texture;
    this.brightPassMaterial.uniforms.threshold.value = this.parameters.threshold;
    this.brightPassMaterial.uniforms.intensity.value = this.parameters.strength;
    
    this.renderer.setRenderTarget(this.brightTarget);
    this.renderer.render(this.postScene, this.postCamera);
    
    // Apply blur passes
    let inputTexture = this.brightTarget.texture;
    
    for (let i = 0; i < this.parameters.passes; i++) {
      // Horizontal blur
      this.postQuad.material = this.blurMaterialH;
      this.blurMaterialH.uniforms.tDiffuse.value = inputTexture;
      this.blurMaterialH.uniforms.resolution.value = this.parameters.resolution / (2 ** i);
      
      this.renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
      this.renderer.render(this.postScene, this.postCamera);
      
      // Vertical blur
      this.postQuad.material = this.blurMaterialV;
      this.blurMaterialV.uniforms.tDiffuse.value = this.renderTargetsHorizontal[i].texture;
      this.blurMaterialV.uniforms.resolution.value = this.parameters.resolution / (2 ** i);
      
      this.renderer.setRenderTarget(this.renderTargetsVertical[i]);
      this.renderer.render(this.postScene, this.postCamera);
      
      inputTexture = this.renderTargetsVertical[i].texture;
    }
    
    // Composite the blur passes with the original scene
    this.postQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms.tDiffuse.value = currentRenderTarget.texture;
    this.compositeMaterial.uniforms.tBloom.value = inputTexture;
    this.compositeMaterial.uniforms.strength.value = this.parameters.strength;
    
    // Use strength from parameters if available (allows audio reactivity)
    if (parameters.bloomStrength !== undefined) {
      this.compositeMaterial.uniforms.strength.value = parameters.bloomStrength;
    }
    
    // Render the composited result to the original render target
    this.renderer.setRenderTarget(currentRenderTarget);
    this.renderer.render(this.postScene, this.postCamera);
    
    // Update metrics
    Performance.endMeasure('bloom-apply');
    this.metrics.renderTime = Performance.getMeasure('bloom-apply') || 0;
    this.metrics.lastUpdateTime = Date.now();
  }
  
  /**
   * Set the bloom effect size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setSize(width, height) {
    if (!this.initialized) return;
    
    const aspectRatio = width / height;
    const resolution = this.parameters.resolution;
    const targetWidth = Math.round(resolution * aspectRatio);
    const targetHeight = resolution;
    
    // Resize the brightness target
    this.brightTarget.setSize(targetWidth, targetHeight);
    
    // Resize blur targets
    for (let i = 0; i < this.parameters.passes; i++) {
      const passWidth = Math.round(targetWidth / (2 ** i));
      const passHeight = Math.round(targetHeight / (2 ** i));
      
      this.renderTargetsHorizontal[i].setSize(passWidth, passHeight);
      this.renderTargetsVertical[i].setSize(passWidth, passHeight);
    }
  }
  
  /**
   * Set a parameter
   * @param {string} name - Parameter name
   * @param {any} value - Parameter value
   */
  setParameter(name, value) {
    if (this.parameters[name] !== undefined) {
      this.parameters[name] = value;
      
      // Update uniforms if needed
      if (name === 'threshold' && this.brightPassMaterial) {
        this.brightPassMaterial.uniforms.threshold.value = value;
      } else if (name === 'strength' && this.brightPassMaterial && this.compositeMaterial) {
        this.brightPassMaterial.uniforms.intensity.value = value;
        this.compositeMaterial.uniforms.strength.value = value;
      } else if (name === 'radius' && this.blurMaterialH && this.blurMaterialV) {
        this.blurMaterialH.uniforms.radius.value = value;
        this.blurMaterialV.uniforms.radius.value = value;
      } else if (name === 'resolution' || name === 'passes') {
        // These require recreating render targets
        this.renderTargetsHorizontal = [];
        this.renderTargetsVertical = [];
        this.createRenderTargets();
      }
    }
  }
  
  /**
   * Configure the effect with new settings
   * @param {Object} config - New configuration
   */
  configure(config) {
    if (!config) return;
    
    // Update configuration
    this.config = { ...this.config, ...config };
    
    // Extract parameters from config
    if (config.enabled !== undefined) this.parameters.enabled = config.enabled;
    if (config.strength !== undefined) this.parameters.strength = config.strength;
    if (config.threshold !== undefined) this.parameters.threshold = config.threshold;
    if (config.radius !== undefined) this.parameters.radius = config.radius;
    if (config.resolution !== undefined) this.parameters.resolution = config.resolution;
    if (config.kernelSize !== undefined) this.parameters.kernelSize = config.kernelSize;
    if (config.quality !== undefined) {
      this.parameters.quality = config.quality;
      this.setQualityParameters();
    }
    if (config.passes !== undefined) this.parameters.passes = config.passes;
    
    // Apply configuration if already initialized
    if (this.initialized) {
      // Update uniforms
      if (this.brightPassMaterial) {
        this.brightPassMaterial.uniforms.threshold.value = this.parameters.threshold;
        this.brightPassMaterial.uniforms.intensity.value = this.parameters.strength;
      }
      
      if (this.blurMaterialH && this.blurMaterialV) {
        this.blurMaterialH.uniforms.radius.value = this.parameters.radius;
        this.blurMaterialV.uniforms.radius.value = this.parameters.radius;
      }
      
      if (this.compositeMaterial) {
        this.compositeMaterial.uniforms.strength.value = this.parameters.strength;
      }
      
      // Recreate render targets if resolution or passes changed
      if (config.resolution !== undefined || config.passes !== undefined || config.quality !== undefined) {
        this.renderTargetsHorizontal = [];
        this.renderTargetsVertical = [];
        this.createRenderTargets();
      }
    }
  }
  
  /**
   * Set a dynamic strength for the bloom effect (useful for audio reactivity)
   * @param {number} strength - Bloom strength (0-1)
   */
  setStrength(strength) {
    // Clamp to valid range
    const clampedStrength = Math.min(Math.max(strength, 0), 2);
    
    if (this.initialized) {
      // Update the materials directly rather than going through parameters
      if (this.brightPassMaterial) {
        this.brightPassMaterial.uniforms.intensity.value = clampedStrength;
      }
      
      if (this.compositeMaterial) {
        this.compositeMaterial.uniforms.strength.value = clampedStrength;
      }
    }
  }
  
  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose render targets
    if (this.brightTarget) {
      this.brightTarget.dispose();
    }
    
    this.renderTargetsHorizontal.forEach(target => {
      target.dispose();
    });
    
    this.renderTargetsVertical.forEach(target => {
      target.dispose();
    });
    
    // Dispose materials
    if (this.brightPassMaterial) this.brightPassMaterial.dispose();
    if (this.blurMaterialH) this.blurMaterialH.dispose();
    if (this.blurMaterialV) this.blurMaterialV.dispose();
    if (this.compositeMaterial) this.compositeMaterial.dispose();
    
    // Dispose post scene
    if (this.postQuad) this.postQuad.geometry.dispose();
    
    this.initialized = false;
    
    console.log('Bloom Effect disposed');
  }
}

export default BloomEffect;