/**
 * Compositor.js
 * 
 * Manages multiple visual layers and blends them together.
 * Allows compositing 2D and 3D fractals with different blending modes.
 */

import * as THREE from 'three';
import { Performance } from '../../utils/Performance';

export class Compositor {
  /**
   * Initialize the Compositor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.renderer = options.renderer;
    this.width = options.width || window.innerWidth;
    this.height = options.height || window.innerHeight;
    this.config = options.config || {};
    this.initialized = false;
    
    // Available blend modes
    this.blendModes = {
      NORMAL: 'normal',
      ADD: 'add',
      MULTIPLY: 'multiply',
      SCREEN: 'screen',
      OVERLAY: 'overlay',
      DIFFERENCE: 'difference'
    };
    
    // Layers array (ordered from bottom to top)
    this.layers = [];
    
    // Default layer opacity transition duration
    this.transitionDuration = this.config.transitionDuration || 1.0; // seconds
  }
  
  /**
   * Initialize the compositor
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('compositor-init-start');
    
    // Create render targets for each layer and the final output
    this.setupRenderTargets();
    
    // Setup blending shader
    this.setupBlendingShader();
    
    this.initialized = true;
    
    Performance.mark('compositor-init-end');
    Performance.measure('compositor-initialization', 'compositor-init-start', 'compositor-init-end');
    
    console.log('Compositor initialized');
    return Promise.resolve();
  }
  
  /**
   * Set up render targets for layers and output
   */
  setupRenderTargets() {
    // Options for render targets
    const options = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    };
    
    // Create output render target
    this.outputTarget = new THREE.WebGLRenderTarget(this.width, this.height, options);
    
    // Create array of render targets for layers
    this.layerTargets = [];
    
    // Create camera and scene for compositing
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    
    // Create full-screen quad
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      null // Will be set when rendering
    );
    
    this.scene.add(this.quad);
  }
  
  /**
   * Set up blending shader for compositing layers
   */
  setupBlendingShader() {
    // Vertex shader for rendering layers
    this.vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
    
    // Fragment shader for blending layers
    this.fragmentShader = `
      uniform sampler2D baseLayer;
      uniform sampler2D blendLayer;
      uniform float opacity;
      uniform int blendMode;
      
      varying vec2 vUv;
      
      vec4 blend_normal(vec4 base, vec4 blend) {
        return mix(base, blend, blend.a * opacity);
      }
      
      vec4 blend_add(vec4 base, vec4 blend) {
        return base + blend * opacity;
      }
      
      vec4 blend_multiply(vec4 base, vec4 blend) {
        return base * mix(vec4(1.0), blend, opacity);
      }
      
      vec4 blend_screen(vec4 base, vec4 blend) {
        return vec4(1.0) - (vec4(1.0) - base) * (vec4(1.0) - blend * opacity);
      }
      
      vec4 blend_overlay(vec4 base, vec4 blend) {
        vec4 result;
        for (int i = 0; i < 3; i++) {
          if (base[i] < 0.5) {
            result[i] = 2.0 * base[i] * blend[i];
          } else {
            result[i] = 1.0 - 2.0 * (1.0 - base[i]) * (1.0 - blend[i]);
          }
        }
        result.a = base.a + blend.a * (1.0 - base.a);
        return mix(base, result, opacity);
      }
      
      vec4 blend_difference(vec4 base, vec4 blend) {
        return base + mix(vec4(0.0), abs(base - blend), opacity);
      }
      
      void main() {
        vec4 base = texture2D(baseLayer, vUv);
        vec4 blend = texture2D(blendLayer, vUv);
        
        // Apply blending based on mode
        if (blendMode == 0) {
          gl_FragColor = blend_normal(base, blend);
        } else if (blendMode == 1) {
          gl_FragColor = blend_add(base, blend);
        } else if (blendMode == 2) {
          gl_FragColor = blend_multiply(base, blend);
        } else if (blendMode == 3) {
          gl_FragColor = blend_screen(base, blend);
        } else if (blendMode == 4) {
          gl_FragColor = blend_overlay(base, blend);
        } else if (blendMode == 5) {
          gl_FragColor = blend_difference(base, blend);
        } else {
          gl_FragColor = base;
        }
      }
    `;
    
    // Create uniforms for the shader
    this.blendUniforms = {
      baseLayer: { value: null },
      blendLayer: { value: null },
      opacity: { value: 1.0 },
      blendMode: { value: 0 } // Default: normal
    };
    
    // Create blend material
    this.blendMaterial = new THREE.ShaderMaterial({
      uniforms: this.blendUniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      depthTest: false,
      depthWrite: false
    });
  }
  
  /**
   * Add a layer to the compositor
   * @param {Object} layer - Layer definition
   * @returns {number} - Layer ID (index)
   */
  addLayer(layer = {}) {
    if (!this.initialized) {
      console.error('Compositor not initialized');
      return -1;
    }
    
    // Default layer properties
    const defaultLayer = {
      name: `layer_${this.layers.length}`,
      renderer: null,        // Fractal renderer (Renderer2D or Renderer3D)
      visible: true,         // Is layer visible
      opacity: 1.0,          // Layer opacity
      blendMode: this.blendModes.NORMAL, // Blend mode
      renderTarget: null,    // Custom render target (if not using the default)
      customRenderFunc: null // Custom render function if not using a standard renderer
    };
    
    // Merge with provided layer
    const newLayer = { ...defaultLayer, ...layer };
    
    // Create render target for this layer if it doesn't have one
    if (!newLayer.renderTarget) {
      newLayer.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false
      });
    }
    
    // Add to layers array
    this.layers.push(newLayer);
    
    // Return layer index
    return this.layers.length - 1;
  }
  
  /**
   * Remove a layer from the compositor
   * @param {number} index - Layer index
   * @returns {boolean} - Success
   */
  removeLayer(index) {
    if (index < 0 || index >= this.layers.length) return false;
    
    // Dispose of render target if not shared
    if (this.layers[index].renderTarget && 
        !this.layers.some((l, i) => i !== index && l.renderTarget === this.layers[index].renderTarget)) {
      this.layers[index].renderTarget.dispose();
    }
    
    // Remove layer
    this.layers.splice(index, 1);
    return true;
  }
  
  /**
   * Move a layer to a new position
   * @param {number} fromIndex - Current layer index
   * @param {number} toIndex - New layer index
   * @returns {boolean} - Success
   */
  moveLayer(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.layers.length ||
        toIndex < 0 || toIndex >= this.layers.length) {
      return false;
    }
    
    // Move the layer
    const layer = this.layers[fromIndex];
    this.layers.splice(fromIndex, 1);
    this.layers.splice(toIndex, 0, layer);
    
    return true;
  }
  
  /**
   * Update a layer's properties
   * @param {number} index - Layer index
   * @param {Object} properties - Properties to update
   * @returns {boolean} - Success
   */
  updateLayer(index, properties = {}) {
    if (index < 0 || index >= this.layers.length) return false;
    
    // Update properties
    Object.assign(this.layers[index], properties);
    
    return true;
  }
  
  /**
   * Set a layer's opacity with optional transition
   * @param {number} index - Layer index
   * @param {number} opacity - Target opacity (0-1)
   * @param {number} duration - Transition duration in seconds (0 for immediate)
   * @returns {Promise} - Resolves when transition completes
   */
  setLayerOpacity(index, opacity, duration = 0) {
    if (index < 0 || index >= this.layers.length) {
      return Promise.reject(new Error('Invalid layer index'));
    }
    
    const layer = this.layers[index];
    const startOpacity = layer.opacity;
    
    // If no transition, set immediately
    if (duration <= 0) {
      layer.opacity = opacity;
      return Promise.resolve();
    }
    
    // Return a promise that resolves when the transition completes
    return new Promise((resolve) => {
      const startTime = performance.now();
      const endTime = startTime + duration * 1000;
      
      const updateOpacity = () => {
        const now = performance.now();
        if (now >= endTime) {
          // Transition complete
          layer.opacity = opacity;
          resolve();
          return;
        }
        
        // Calculate current opacity
        const progress = (now - startTime) / (endTime - startTime);
        layer.opacity = startOpacity + (opacity - startOpacity) * progress;
        
        // Continue animation
        requestAnimationFrame(updateOpacity);
      };
      
      // Start animation
      updateOpacity();
    });
  }
  
  /**
   * Render all visible layers to the output
   * @param {Object} parameters - Additional parameters
   * @returns {THREE.WebGLRenderTarget} - Output render target
   */
  render(parameters = {}) {
    if (!this.initialized || !this.renderer) {
      console.error('Compositor not initialized or missing renderer');
      return null;
    }
    
    Performance.startMeasure('compositor-render');
    
    // Store current renderer state
    const currentRenderTarget = this.renderer.getRenderTarget();
    
    // First, render each layer to its target
    this.renderLayers(parameters);
    
    // Then composite layers together
    this.compositeLayers();
    
    // Restore renderer state
    this.renderer.setRenderTarget(currentRenderTarget);
    
    Performance.endMeasure('compositor-render');
    
    return this.outputTarget;
  }
  
  /**
   * Render individual layers to their targets
   * @param {Object} parameters - Additional parameters
   */
  renderLayers(parameters = {}) {
    // Render each visible layer
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      
      // Set the render target
      this.renderer.setRenderTarget(layer.renderTarget);
      
      // If using custom render function
      if (typeof layer.customRenderFunc === 'function') {
        layer.customRenderFunc(this.renderer, parameters);
      } 
      // If using a standard renderer
      else if (layer.renderer) {
        if (typeof layer.renderer.update === 'function') {
          layer.renderer.update(parameters);
        }
        
        if (typeof layer.renderer.render === 'function') {
          layer.renderer.render();
        }
      }
    }
  }
  
  /**
   * Composite layers together
   */
  compositeLayers() {
    // Filter visible layers
    const visibleLayers = this.layers.filter(layer => layer.visible && layer.opacity > 0);
    
    if (visibleLayers.length === 0) {
      // No visible layers, clear output
      this.renderer.setRenderTarget(this.outputTarget);
      this.renderer.clear();
      return;
    }
    
    if (visibleLayers.length === 1 && visibleLayers[0].opacity === 1.0) {
      // Just one fully opaque layer, copy it directly
      this.renderer.setRenderTarget(this.outputTarget);
      this.copyTexture(visibleLayers[0].renderTarget.texture);
      return;
    }
    
    // Start with the bottom layer
    let baseTarget = visibleLayers[0].renderTarget;
    
    // If we have more than one layer, blend them together
    let currentOutput = this.outputTarget;
    
    for (let i = 1; i < visibleLayers.length; i++) {
      const layer = visibleLayers[i];
      
      // Set blend uniforms
      this.blendUniforms.baseLayer.value = baseTarget.texture;
      this.blendUniforms.blendLayer.value = layer.renderTarget.texture;
      this.blendUniforms.opacity.value = layer.opacity;
      
      // Set blend mode
      switch (layer.blendMode) {
        case this.blendModes.ADD:
          this.blendUniforms.blendMode.value = 1;
          break;
        case this.blendModes.MULTIPLY:
          this.blendUniforms.blendMode.value = 2;
          break;
        case this.blendModes.SCREEN:
          this.blendUniforms.blendMode.value = 3;
          break;
        case this.blendModes.OVERLAY:
          this.blendUniforms.blendMode.value = 4;
          break;
        case this.blendModes.DIFFERENCE:
          this.blendUniforms.blendMode.value = 5;
          break;
        default:
          this.blendUniforms.blendMode.value = 0; // Normal
      }
      
      // Apply blend shader
      this.quad.material = this.blendMaterial;
      this.renderer.setRenderTarget(currentOutput);
      this.renderer.render(this.scene, this.camera);
      
      // Set as base for next layer
      baseTarget = currentOutput;
    }
  }
  
  /**
   * Copy a texture to the current render target
   * @param {THREE.Texture} texture - Texture to copy
   */
  copyTexture(texture) {
    // Create a simple material for copying
    if (!this.copyMaterial) {
      this.copyMaterial = new THREE.MeshBasicMaterial({
        map: null,
        depthTest: false,
        depthWrite: false
      });
    }
    
    // Set the texture and render
    this.copyMaterial.map = texture;
    this.quad.material = this.copyMaterial;
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Render the output to the screen
   */
  renderToScreen() {
    // Set null render target (default framebuffer)
    this.renderer.setRenderTarget(null);
    
    // Copy the output texture to the screen
    this.copyTexture(this.outputTarget.texture);
  }
  
  /**
   * Set compositor size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setSize(width, height) {
    if (!this.initialized) return;
    
    this.width = width;
    this.height = height;
    
    // Resize output target
    this.outputTarget.setSize(width, height);
    
    // Resize layer targets
    for (const layer of this.layers) {
      if (layer.renderTarget) {
        layer.renderTarget.setSize(width, height);
      }
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (!this.initialized) return;
    
    // Dispose render targets
    this.outputTarget.dispose();
    
    for (const layer of this.layers) {
      if (layer.renderTarget) {
        layer.renderTarget.dispose();
      }
    }
    
    // Dispose materials
    if (this.blendMaterial) this.blendMaterial.dispose();
    if (this.copyMaterial) this.copyMaterial.dispose();
    
    // Dispose geometry
    if (this.quad) this.quad.geometry.dispose();
    
    this.initialized = false;
  }
}

export default Compositor;