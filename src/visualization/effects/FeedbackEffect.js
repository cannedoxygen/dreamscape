/**
 * FeedbackEffect.js
 * 
 * Creates visual feedback effects by feeding the rendered output back into itself.
 * Useful for creating motion trails, echo effects, and fluid-like motion.
 */

import * as THREE from 'three';
import { Performance } from '../../utils/Performance';

export class FeedbackEffect {
  /**
   * Initialize the FeedbackEffect
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.renderer = options.renderer;
    this.initialized = false;
    
    // Default parameters
    this.feedbackAmount = this.config.amount || 0.9;
    this.fadeSpeed = this.config.fadeSpeed || 0.05;
    this.blurAmount = this.config.blurAmount || 0.5;
    this.offsetX = this.config.offsetX || 0;
    this.offsetY = this.config.offsetY || 0;
    this.zoom = this.config.zoom || 1.0;
    this.rotation = this.config.rotation || 0;
    this.tint = this.config.tint || new THREE.Color(1, 1, 1);
    
    // Audio reactivity
    this.audioReactive = this.config.audioReactive || false;
    
    // If using persistent feedback, we need two buffers
    this.usePersistentFeedback = this.config.persistent || false;
    
    // Create shader material
    this.createShaderMaterial();
  }
  
  /**
   * Initialize the effect
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    if (this.initialized) return Promise.resolve();
    
    Performance.mark('feedback-init-start');
    
    // Create render targets for feedback
    this.setupRenderTargets();
    
    // Create scene with fullscreen quad
    this.setupScene();
    
    this.initialized = true;
    
    Performance.mark('feedback-init-end');
    Performance.measure('feedback-initialization', 'feedback-init-start', 'feedback-init-end');
    
    console.log('FeedbackEffect initialized');
    return Promise.resolve();
  }
  
  /**
   * Create the feedback shader material
   */
  createShaderMaterial() {
    // Vertex shader - simple passthrough
    this.vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;
    
    // Fragment shader for feedback effect
    this.fragmentShader = `
      uniform sampler2D currentFrame;
      uniform sampler2D previousFrame;
      uniform float feedbackAmount;
      uniform float fadeSpeed;
      uniform float blurAmount;
      uniform vec2 resolution;
      uniform vec2 offset;
      uniform float zoom;
      uniform float rotation;
      uniform vec3 tint;
      
      varying vec2 vUv;
      
      void main() {
        // Current frame color
        vec4 current = texture2D(currentFrame, vUv);
        
        // Calculate distorted coordinates for feedback
        vec2 center = vec2(0.5, 0.5);
        vec2 uv = vUv - center;
        
        // Apply rotation
        float s = sin(rotation);
        float c = cos(rotation);
        vec2 rotatedUv = vec2(
          uv.x * c - uv.y * s,
          uv.x * s + uv.y * c
        );
        
        // Apply zoom
        rotatedUv = rotatedUv / zoom;
        
        // Apply offset and recenter
        vec2 distortedUv = rotatedUv + center + offset / resolution;
        
        // Apply blur by sampling multiple points
        vec4 feedback = vec4(0.0);
        
        if (blurAmount > 0.0) {
          // 9-point blur
          float blurSize = blurAmount / 512.0;
          
          feedback += texture2D(previousFrame, distortedUv + vec2(-blurSize, -blurSize)) * 0.0625;
          feedback += texture2D(previousFrame, distortedUv + vec2(0.0, -blurSize)) * 0.125;
          feedback += texture2D(previousFrame, distortedUv + vec2(blurSize, -blurSize)) * 0.0625;
          
          feedback += texture2D(previousFrame, distortedUv + vec2(-blurSize, 0.0)) * 0.125;
          feedback += texture2D(previousFrame, distortedUv) * 0.25;
          feedback += texture2D(previousFrame, distortedUv + vec2(blurSize, 0.0)) * 0.125;
          
          feedback += texture2D(previousFrame, distortedUv + vec2(-blurSize, blurSize)) * 0.0625;
          feedback += texture2D(previousFrame, distortedUv + vec2(0.0, blurSize)) * 0.125;
          feedback += texture2D(previousFrame, distortedUv + vec2(blurSize, blurSize)) * 0.0625;
        } else {
          feedback = texture2D(previousFrame, distortedUv);
        }
        
        // Apply fade (reduce brightness)
        feedback.rgb *= (1.0 - fadeSpeed);
        
        // Apply tint
        feedback.rgb *= tint;
        
        // Mix current frame with feedback
        gl_FragColor = mix(current, feedback, feedbackAmount);
      }
    `;
    
    // Create uniforms for the shader
    this.uniforms = {
      currentFrame: { value: null },
      previousFrame: { value: null },
      feedbackAmount: { value: this.feedbackAmount },
      fadeSpeed: { value: this.fadeSpeed },
      blurAmount: { value: this.blurAmount },
      resolution: { value: new THREE.Vector2(1, 1) },
      offset: { value: new THREE.Vector2(this.offsetX, this.offsetY) },
      zoom: { value: this.zoom },
      rotation: { value: this.rotation },
      tint: { value: new THREE.Color().fromArray(this.tint instanceof THREE.Color ? this.tint.toArray() : this.tint) }
    };
    
    // Create the material
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      depthTest: false,
      depthWrite: false
    });
  }
  
  /**
   * Set up render targets for the feedback effect
   */
  setupRenderTargets() {
    // Get renderer size
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    
    // Options for render targets
    const options = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    };
    
    // Create render targets
    this.targetA = new THREE.WebGLRenderTarget(size.x, size.y, options);
    this.targetB = new THREE.WebGLRenderTarget(size.x, size.y, options);
    
    // Set initial resolution uniform
    this.uniforms.resolution.value.set(size.x, size.y);
  }
  
  /**
   * Set up the scene with a fullscreen quad
   */
  setupScene() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    
    // Create a fullscreen quad
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );
    
    this.scene.add(this.quad);
  }
  
  /**
   * Apply the feedback effect
   * @param {Object} parameters - Effect parameters
   */
  apply(parameters = {}) {
    if (!this.initialized || !this.renderer) return;
    
    Performance.startMeasure('feedback-effect');
    
    // Update uniforms from parameters
    this.updateUniforms(parameters);
    
    // Get the current renderer target
    const currentRenderTarget = this.renderer.getRenderTarget();
    
    // Set current frame texture
    this.uniforms.currentFrame.value = currentRenderTarget ? currentRenderTarget.texture : null;
    
    // Set previous frame texture (from our last feedback pass)
    this.uniforms.previousFrame.value = this.targetA.texture;
    
    // Render to target B
    this.renderer.setRenderTarget(this.targetB);
    this.renderer.render(this.scene, this.camera);
    
    // Copy result back to screen or the current render target
    this.renderer.setRenderTarget(currentRenderTarget);
    this.renderer.render(this.scene, this.camera);
    
    // Swap render targets for next frame
    const temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;
    
    Performance.endMeasure('feedback-effect');
  }
  
  /**
   * Update uniforms from parameters
   * @param {Object} parameters - Effect parameters
   */
  updateUniforms(parameters = {}) {
    // Update effect parameters
    if (parameters.feedbackAmount !== undefined) this.feedbackAmount = parameters.feedbackAmount;
    if (parameters.fadeSpeed !== undefined) this.fadeSpeed = parameters.fadeSpeed;
    if (parameters.blurAmount !== undefined) this.blurAmount = parameters.blurAmount;
    if (parameters.offsetX !== undefined) this.offsetX = parameters.offsetX;
    if (parameters.offsetY !== undefined) this.offsetY = parameters.offsetY;
    if (parameters.zoom !== undefined) this.zoom = parameters.zoom;
    if (parameters.rotation !== undefined) this.rotation = parameters.rotation;
    
    // Update audio reactivity
    if (parameters.audioData && this.audioReactive) {
      // Adjust feedback amount based on volume
      if (parameters.audioData.volume) {
        this.uniforms.feedbackAmount.value = 
          this.feedbackAmount * (1 + parameters.audioData.volume * 0.2);
      }
      
      // Adjust offset based on bass
      if (parameters.audioData.bass) {
        const bassImpact = parameters.audioData.bass * 0.01;
        this.uniforms.offset.value.x = this.offsetX + Math.sin(Date.now() * 0.001) * bassImpact;
        this.uniforms.offset.value.y = this.offsetY + Math.cos(Date.now() * 0.001) * bassImpact;
      }
      
      // Adjust rotation based on mid frequencies
      if (parameters.audioData.mid) {
        this.uniforms.rotation.value = 
          this.rotation + parameters.audioData.mid * 0.01;
      }
      
      // Adjust zoom based on treble
      if (parameters.audioData.treble) {
        this.uniforms.zoom.value = 
          this.zoom * (1 + parameters.audioData.treble * 0.05);
      }
    } else {
      // Update uniforms directly from parameters
      this.uniforms.feedbackAmount.value = this.feedbackAmount;
      this.uniforms.fadeSpeed.value = this.fadeSpeed;
      this.uniforms.blurAmount.value = this.blurAmount;
      this.uniforms.offset.value.set(this.offsetX, this.offsetY);
      this.uniforms.zoom.value = this.zoom;
      this.uniforms.rotation.value = this.rotation;
    }
  }
  
  /**
   * Configure the effect
   * @param {Object} config - Configuration options
   */
  configure(config = {}) {
    if (config.amount !== undefined) this.feedbackAmount = config.amount;
    if (config.fadeSpeed !== undefined) this.fadeSpeed = config.fadeSpeed;
    if (config.blurAmount !== undefined) this.blurAmount = config.blurAmount;
    if (config.offsetX !== undefined) this.offsetX = config.offsetX;
    if (config.offsetY !== undefined) this.offsetY = config.offsetY;
    if (config.zoom !== undefined) this.zoom = config.zoom;
    if (config.rotation !== undefined) this.rotation = config.rotation;
    if (config.audioReactive !== undefined) this.audioReactive = config.audioReactive;
    
    if (config.tint) {
      const color = new THREE.Color(config.tint);
      this.tint = color;
      this.uniforms.tint.value.copy(color);
    }
    
    // Update all uniforms
    this.updateUniforms({});
  }
  
  /**
   * Set effect size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setSize(width, height) {
    if (!this.initialized) return;
    
    // Update render targets
    this.targetA.setSize(width, height);
    this.targetB.setSize(width, height);
    
    // Update resolution uniform
    this.uniforms.resolution.value.set(width, height);
  }
  
  /**
   * Reset feedback (clear trails)
   */
  reset() {
    if (!this.initialized || !this.renderer) return;
    
    // Clear render targets
    const currentRenderTarget = this.renderer.getRenderTarget();
    
    const clearColor = new THREE.Color(0, 0, 0);
    this.renderer.setRenderTarget(this.targetA);
    this.renderer.setClearColor(clearColor, 0);
    this.renderer.clear();
    
    this.renderer.setRenderTarget(this.targetB);
    this.renderer.clear();
    
    this.renderer.setRenderTarget(currentRenderTarget);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.quad) this.quad.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.targetA) this.targetA.dispose();
    if (this.targetB) this.targetB.dispose();
    
    this.initialized = false;
  }
}

export default FeedbackEffect;