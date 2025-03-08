/**
 * FractalEngine.js
 * 
 * Main controller for fractal visualization.
 * Manages all renderers, effects, and coordinates with audio system.
 */

import * as THREE from 'three';
import { Renderer2D } from './renderers/Renderer2D';
import { Renderer3D } from './renderers/Renderer3D';
import { Compositor } from './renderers/Compositor';
import { BloomEffect } from './effects/BloomEffect';
import { FeedbackEffect } from './effects/FeedbackEffect';
import { ColorCycler } from './effects/ColorCycler';
import { Performance } from '../utils/Performance';

export class FractalEngine {
  /**
   * Initialize the FractalEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.container = options.container;
    this.config = options.config || {};
    
    // Set default dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Engine state
    this.isRunning = false;
    this.isPaused = false;
    this.activeRenderer = 'mandelbrot'; // Default fractal
    
    // Store all renderers
    this.renderers = {};
    
    // Store all effects
    this.effects = {};
    
    // Store fractal parameters
    this.parameters = {
      zoom: 1,
      centerX: 0,
      centerY: 0,
      iterations: 100,
      colorShift: 0,
      rotationAngle: 0,
      juliaReal: -0.7,
      juliaImag: 0.27,
      exponent: 2,
      bailout: 4,
      quality: 1 // Render quality multiplier (0.5 to 2)
    };
    
    // Event callbacks
    this.eventHandlers = {
      onRender: [],
      onParameterChange: [],
      onFractalChange: []
    };
    
    // Animation frame ID for cancellation
    this.animationFrameId = null;
    
    // Audio reactivity parameters
    this.audioData = {
      frequencyData: new Uint8Array(128),
      waveformData: new Uint8Array(128),
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0
    };
    
    // Performance metrics
    this.metrics = {
      fps: 0,
      renderTime: 0,
      updateCount: 0
    };
    
    // Automatically resize on window resize
    this.handleResize = this.handleResize.bind(this);
    this.animate = this.animate.bind(this);
  }
  
  /**
   * Initialize the engine, renderers, and effects
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    console.log('Initializing Fractal Engine...');
    Performance.mark('fractal-init-start');
    
    // Create THREE.js scene for 3D fractals
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
    this.camera.position.z = 5;
    
    // Create renderer
    this.threeRenderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true // Needed for feedback effects
    });
    this.threeRenderer.setSize(this.width, this.height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.container.appendChild(this.threeRenderer.domElement);
    
    // Check WebGL capabilities
    const gl = this.threeRenderer.getContext();
    const extensions = {
      floatTextures: !!gl.getExtension('OES_texture_float'),
      halfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
      anisotropic: !!gl.getExtension('EXT_texture_filter_anisotropic'),
      drawBuffers: !!gl.getExtension('WEBGL_draw_buffers')
    };
    console.log('WebGL Extensions:', extensions);
    
    // Adjust quality based on device capabilities
    this.adjustQualityForDevice(gl, extensions);
    
    // Initialize fractal renderers
    await this.initializeRenderers(extensions);
    
    // Initialize compositor for layer blending
    this.compositor = new Compositor({
      renderer: this.threeRenderer,
      width: this.width,
      height: this.height
    });
    
    // Initialize post-processing effects
    await this.initializeEffects(extensions);
    
    // Setup resize handler
    window.addEventListener('resize', this.handleResize);
    
    Performance.mark('fractal-init-end');
    Performance.measure('fractal-initialization', 'fractal-init-start', 'fractal-init-end');
    console.log('Fractal Engine initialized', Performance.getLastMeasure('fractal-initialization'));
    
    return Promise.resolve();
  }
  
  /**
   * Initialize all fractal renderers
   * @param {Object} extensions - WebGL extensions available
   * @returns {Promise} - Resolves when all renderers are initialized
   */
  async initializeRenderers(extensions) {
    // Initialize 2D renderers
    this.renderers.mandelbrot = new Renderer2D({
      name: 'mandelbrot',
      renderer: this.threeRenderer,
      fragmentShader: await this.loadShader('mandelbrot.frag'),
      config: this.config.renderers?.mandelbrot
    });
    
    this.renderers.julia = new Renderer2D({
      name: 'julia',
      renderer: this.threeRenderer,
      fragmentShader: await this.loadShader('julia.frag'),
      config: this.config.renderers?.julia
    });
    
    this.renderers.burningShip = new Renderer2D({
      name: 'burningShip',
      renderer: this.threeRenderer,
      fragmentShader: await this.loadShader('burningShip.frag'),
      config: this.config.renderers?.burningShip
    });
    
    this.renderers.hyperbolic = new Renderer2D({
      name: 'hyperbolic',
      renderer: this.threeRenderer,
      fragmentShader: await this.loadShader('hyperbolic.frag'),
      config: this.config.renderers?.hyperbolic
    });
    
    // Initialize 3D renderers if supported
    if (extensions.drawBuffers && extensions.floatTextures) {
      this.renderers.mandelbulb = new Renderer3D({
        name: 'mandelbulb',
        scene: this.scene,
        camera: this.camera,
        renderer: this.threeRenderer,
        fragmentShader: await this.loadShader('mandelbulb.frag'),
        config: this.config.renderers?.mandelbulb
      });
    }
    
    // Initialize all renderers
    for (const [name, renderer] of Object.entries(this.renderers)) {
      await renderer.initialize();
      renderer.setSize(this.width, this.height);
    }
    
    return Promise.resolve();
  }
  
  /**
   * Initialize all visual effects
   * @param {Object} extensions - WebGL extensions available
   * @returns {Promise} - Resolves when all effects are initialized
   */
  async initializeEffects(extensions) {
    // Bloom effect for glow
    this.effects.bloom = new BloomEffect({
      renderer: this.threeRenderer,
      scene: this.scene,
      camera: this.camera,
      config: this.config.effects?.bloom,
      extensions
    });
    
    // Feedback effect for motion trails
    this.effects.feedback = new FeedbackEffect({
      renderer: this.threeRenderer,
      config: this.config.effects?.feedback
    });
    
    // Color cycling effect
    this.effects.colorCycler = new ColorCycler({
      config: this.config.effects?.colorCycler
    });
    
    // Initialize all effects
    for (const effect of Object.values(this.effects)) {
      if (typeof effect.initialize === 'function') {
        await effect.initialize();
      }
    }
    
    return Promise.resolve();
  }
  
  /**
   * Load a shader from the shaders directory
   * @param {string} filename - Shader filename
   * @returns {Promise<string>} - The shader source code
   */
  async loadShader(filename) {
    try {
      // Use dynamic import with raw-loader
      const shaderModule = await import(`./shaders/${filename}`);
      // Get the actual shader string from the module
      const shaderContent = typeof shaderModule === 'string' 
        ? shaderModule 
        : (shaderModule.default || '');
        
      // Verify that we have a string
      if (typeof shaderContent !== 'string') {
        console.error(`Shader ${filename} did not load as a string:`, shaderContent);
        throw new Error(`Invalid shader content type for ${filename}`);
      }
      
      return shaderContent;
    } catch (error) {
      console.error(`Failed to load shader: ${filename}`, error);
      
      // Fallback to a basic shader if loading fails
      if (filename.includes('mandelbrot')) {
        return `
          precision highp float;
          uniform vec2 resolution;
          uniform float time;
          void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy * 2.0 - 1.0;
            gl_FragColor = vec4(abs(sin(uv.x * 10.0 + time)), abs(cos(uv.y * 10.0 - time)), 0.5, 1.0);
          }
        `;
      }
      return '';
    }
  }
  
  /**
   * Adjust rendering quality based on device capabilities
   * @param {WebGLRenderingContext} gl - WebGL context
   * @param {Object} extensions - Available WebGL extensions
   */
  adjustQualityForDevice(gl, extensions) {
    // Get max texture size and hardware info
    const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxFragUniform = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    const vendor = gl.getParameter(gl.VENDOR);
    const renderer = gl.getParameter(gl.RENDERER);
    
    console.log('WebGL Info:', {
      vendor,
      renderer,
      maxTexSize,
      maxFragUniform
    });
    
    // Determine if this is a high-end, mid-range, or low-end device
    let deviceTier = 'mid';
    
    // High-end GPUs usually have large texture sizes and uniform counts
    if (maxTexSize >= 8192 && maxFragUniform >= 1024 && extensions.floatTextures) {
      deviceTier = 'high';
    } 
    // Low-end devices often have limited resources
    else if (maxTexSize <= 4096 || maxFragUniform <= 512 || !extensions.halfFloatTextures) {
      deviceTier = 'low';
    }
    
    // Adjust quality parameters based on device tier
    switch (deviceTier) {
      case 'high':
        this.parameters.quality = 1.5; // Higher quality
        this.parameters.iterations = 200; // More iterations
        break;
      case 'low':
        this.parameters.quality = 0.75; // Lower quality
        this.parameters.iterations = 100; // Fewer iterations
        break;
      default: // 'mid'
        this.parameters.quality = 1.0;
        this.parameters.iterations = 150;
    }
    
    console.log(`Device tier detected: ${deviceTier}, quality set to ${this.parameters.quality}`);
  }
  
  /**
   * Start the rendering loop
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.animate();
    
    console.log('Fractal Engine started');
  }
  
  /**
   * Stop the rendering loop
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Fractal Engine stopped');
  }
  
  /**
   * Pause rendering (keep engine running but freeze updates)
   */
  pause() {
    this.isPaused = true;
    console.log('Fractal Engine paused');
  }
  
  /**
   * Resume rendering after pause
   */
  resume() {
    this.isPaused = false;
    console.log('Fractal Engine resumed');
  }
  
  /**
   * Main animation loop
   */
  animate() {
    if (!this.isRunning) return;
    
    // Request next frame first to ensure smooth animation
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Skip rendering if paused
    if (this.isPaused) return;
    
    Performance.startMeasure('frame');
    
    // Update color cycling effect
    this.effects.colorCycler.update();
    this.parameters.colorShift = this.effects.colorCycler.value;
    
    // Update active renderer with current parameters
    const activeRenderer = this.renderers[this.activeRenderer];
    if (activeRenderer) {
      activeRenderer.update(this.parameters);
      activeRenderer.render();
    }
    
    // Apply post-processing effects
    this.applyEffects();
    
    // Call render callbacks
    this.dispatchEvent('onRender', this.parameters);
    
    // Update performance metrics
    Performance.endMeasure('frame');
    this.updatePerformanceMetrics();
  }
  
  /**
   * Apply post-processing effects
   */
  applyEffects() {
    // Apply bloom effect for glow
    if (this.config.effects?.bloom?.enabled) {
      this.effects.bloom.apply(this.parameters);
    }
    
    // Apply feedback effect for motion trails
    if (this.config.effects?.feedback?.enabled) {
      this.effects.feedback.apply(this.parameters);
    }
  }
  
  /**
   * Update performance metrics for monitoring
   */
  updatePerformanceMetrics() {
    this.metrics.updateCount++;
    
    // Only update FPS every 10 frames to avoid jitter
    if (this.metrics.updateCount % 10 === 0) {
      const lastFrameTime = Performance.getLastMeasure('frame').duration;
      this.metrics.renderTime = lastFrameTime;
      this.metrics.fps = Math.round(1000 / lastFrameTime);
    }
  }
  
  /**
   * Set the active fractal type
   * @param {string} type - Fractal type name
   * @returns {boolean} - Success status
   */
  setFractalType(type) {
    if (this.renderers[type]) {
      const previousRenderer = this.activeRenderer;
      this.activeRenderer = type;
      console.log(`Switched to fractal type: ${type}`);
      
      // Notify listeners
      this.dispatchEvent('onFractalChange', {
        previous: previousRenderer,
        current: type
      });
      
      return true;
    }
    console.warn(`Fractal type not found: ${type}`);
    return false;
  }
  
  /**
   * Set a single fractal parameter
   * @param {string} name - Parameter name
   * @param {any} value - Parameter value
   * @returns {boolean} - Success status
   */
  setParameter(name, value) {
    if (name in this.parameters) {
      const oldValue = this.parameters[name];
      this.parameters[name] = value;
      
      // Notify listeners of the parameter change
      this.dispatchEvent('onParameterChange', {
        name,
        oldValue,
        newValue: value
      });
      
      return true;
    }
    return false;
  }
  
  /**
   * Set multiple parameters at once
   * @param {Object} params - Object containing parameter names and values
   * @returns {Object} - Object of successfully set parameters
   */
  setParameters(params) {
    const results = {};
    
    for (const [name, value] of Object.entries(params)) {
      results[name] = this.setParameter(name, value);
    }
    
    return results;
  }
  
  /**
   * Apply a preset configuration
   * @param {Object} preset - Preset configuration
   * @returns {boolean} - Success status
   */
  applyPreset(preset) {
    if (!preset) return false;
    
    try {
      // Apply fractal type if specified
      if (preset.fractalType && this.renderers[preset.fractalType]) {
        this.setFractalType(preset.fractalType);
      }
      
      // Apply parameters if specified
      if (preset.parameters) {
        this.setParameters(preset.parameters);
      }
      
      // Apply effect settings if specified
      if (preset.effects) {
        for (const [effectName, effectSettings] of Object.entries(preset.effects)) {
          if (this.effects[effectName]) {
            this.effects[effectName].configure(effectSettings);
          }
        }
      }
      
      console.log('Applied preset:', preset.name || 'unnamed');
      return true;
    } catch (error) {
      console.error('Failed to apply preset:', error);
      return false;
    }
  }
  
  /**
   * Update audio data for audio-reactive visuals
   * @param {Object} audioData - Audio analysis data
   */
  updateAudioData(audioData) {
    this.audioData = { ...this.audioData, ...audioData };
    
    // Apply audio reactivity to fractal parameters
    if (this.config.audioReactive) {
      // Example: Bass affects zoom
      if (this.audioData.bass > 0.8) {
        this.parameters.zoom *= 1.01;
      }
      
      // Example: Mid frequencies affect rotation
      this.parameters.rotationAngle += this.audioData.mid * 0.01;
      
      // Example: Volume affects iteration count
      const baseIterations = 100;
      const maxExtraIterations = 200;
      this.parameters.iterations = baseIterations + (this.audioData.volume * maxExtraIterations);
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    
    // Update camera
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    
    // Update renderer
    this.threeRenderer.setSize(this.width, this.height);
    
    // Update all renderers
    Object.values(this.renderers).forEach(renderer => {
      if (typeof renderer.setSize === 'function') {
        renderer.setSize(this.width, this.height);
      }
    });
    
    // Update compositor
    if (this.compositor && typeof this.compositor.setSize === 'function') {
      this.compositor.setSize(this.width, this.height);
    }
    
    // Update effects
    Object.values(this.effects).forEach(effect => {
      if (typeof effect.setSize === 'function') {
        effect.setSize(this.width, this.height);
      }
    });
    
    console.log('Fractal Engine resized', { width: this.width, height: this.height });
  }
  
  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (this.eventHandlers[event] && typeof callback === 'function') {
      this.eventHandlers[event].push(callback);
    }
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  removeEventListener(event, callback) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(callback);
      if (index !== -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }
  
  /**
   * Dispatch an event to all listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  dispatchEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Get current engine state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      activeRenderer: this.activeRenderer,
      parameters: { ...this.parameters },
      dimensions: { width: this.width, height: this.height },
      performance: this.metrics,
      audioData: { ...this.audioData }
    };
  }
  
  /**
   * Take a screenshot of the current fractal
   * @returns {string} - Data URL of the screenshot
   */
  takeScreenshot() {
    return this.threeRenderer.domElement.toDataURL('image/png');
  }
  
  /**
   * Clean up resources when the engine is no longer needed
   */
  dispose() {
    this.stop();
    
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose of renderers
    Object.values(this.renderers).forEach(renderer => {
      if (typeof renderer.dispose === 'function') {
        renderer.dispose();
      }
    });
    
    // Dispose of effects
    Object.values(this.effects).forEach(effect => {
      if (typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });
    
    // Dispose of THREE.js resources
    this.scene.dispose();
    this.threeRenderer.dispose();
    
    // Remove canvas from DOM
    if (this.container && this.threeRenderer.domElement) {
      this.container.removeChild(this.threeRenderer.domElement);
    }
    
    console.log('Fractal Engine disposed');
  }
}

export default FractalEngine;