/**
 * BinauralGenerator.js
 * 
 * Generates binaural beats by creating two oscillators with slightly 
 * different frequencies sent to left and right ears. The brain perceives
 * a "beat" at the difference frequency, which can influence brainwave states.
 * 
 * Different frequency ranges correspond to different brain states:
 * - Delta (0.5-4 Hz): Deep sleep, healing
 * - Theta (4-8 Hz): Meditation, creativity, REM sleep
 * - Alpha (8-13 Hz): Relaxed awareness, calm
 * - Beta (13-30 Hz): Active thinking, focus, alertness
 * - Gamma (30-100 Hz): Higher mental activity, problem solving
 */

await Tone.start()
import { Performance } from '../../utils/Performance';

export class BinauralGenerator {
  /**
   * Initialize the binaural beat generator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.context = options.context || Tone.context;
    this.output = options.output || Tone.Destination;
    this.config = options.config || {};
    
    // Default parameters
    this.parameters = {
      carrierFrequency: this.config.carrierFrequency || 432, // Base frequency in Hz
      beatFrequency: this.config.beatFrequency || 7.83, // Schumann resonance
      waveform: this.config.waveform || 'sine',
      volume: this.config.volume !== undefined ? this.config.volume : 0.3,
      panning: this.config.panning || 0.7, // How wide the stereo separation is (0-1)
      modulation: this.config.modulation || 'none', // 'none', 'am', or 'fm'
      modulationRate: this.config.modulationRate || 0.1, // Modulation rate in Hz
      modulationDepth: this.config.modulationDepth || 0.3 // Modulation depth (0-1)
    };
    
    // Audio nodes
    this.leftOscillator = null;
    this.rightOscillator = null;
    this.leftGain = null;
    this.rightGain = null;
    this.leftPanner = null;
    this.rightPanner = null;
    this.masterGain = null;
    this.modulator = null;
    
    // State
    this.initialized = false;
    this.isPlaying = false;
    
    // Performance metrics
    this.metrics = {
      cpuLoad: 0,
      updateCount: 0
    };
  }
  
  /**
   * Initialize the binaural generator
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('binaural-init-start');
    
    try {
      console.log('Initializing BinauralGenerator...');
      
      // Create master gain node
      this.masterGain = new Tone.Gain(this.parameters.volume).connect(this.output);
      
      // Create left and right panners
      this.leftPanner = new Tone.Panner(-this.parameters.panning).connect(this.masterGain);
      this.rightPanner = new Tone.Panner(this.parameters.panning).connect(this.masterGain);
      
      // Create left and right gain nodes
      this.leftGain = new Tone.Gain(1).connect(this.leftPanner);
      this.rightGain = new Tone.Gain(1).connect(this.rightPanner);
      
      // Calculate frequencies for left and right channels
      const leftFreq = this.parameters.carrierFrequency - (this.parameters.beatFrequency / 2);
      const rightFreq = this.parameters.carrierFrequency + (this.parameters.beatFrequency / 2);
      
      // Create oscillators
      this.leftOscillator = new Tone.Oscillator({
        frequency: leftFreq,
        type: this.parameters.waveform
      }).connect(this.leftGain);
      
      this.rightOscillator = new Tone.Oscillator({
        frequency: rightFreq,
        type: this.parameters.waveform
      }).connect(this.rightGain);
      
      // Create modulation if needed
      if (this.parameters.modulation !== 'none') {
        this.setupModulation();
      }
      
      // Setup automatic CPU monitoring
      this.startPerformanceMonitoring();
      
      this.initialized = true;
      
      Performance.mark('binaural-init-end');
      Performance.measure('binaural-initialization', 'binaural-init-start', 'binaural-init-end');
      
      console.log('BinauralGenerator initialized', Performance.getLastMeasure('binaural-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize BinauralGenerator:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Setup oscillator modulation (AM or FM)
   */
  setupModulation() {
    // Create modulator oscillator
    this.modulator = new Tone.Oscillator({
      frequency: this.parameters.modulationRate,
      type: 'sine'
    });
    
    if (this.parameters.modulation === 'am') {
      // Amplitude modulation
      const modulationGain = new Tone.Gain(this.parameters.modulationDepth).connect(this.masterGain.gain);
      
      // Scale and offset to prevent negative gain
      modulationGain.gain.value = this.parameters.modulationDepth;
      this.masterGain.gain.value = 1 - this.parameters.modulationDepth;
      
      this.modulator.connect(modulationGain);
    } else if (this.parameters.modulation === 'fm') {
      // Frequency modulation
      const modulationAmount = this.parameters.modulationDepth * 10; // Scale depth to reasonable FM amount
      
      // Connect modulator to frequency of both oscillators
      const leftModulationGain = new Tone.Gain(modulationAmount).connect(this.leftOscillator.frequency);
      const rightModulationGain = new Tone.Gain(modulationAmount).connect(this.rightOscillator.frequency);
      
      this.modulator.connect(leftModulationGain);
      this.modulator.connect(rightModulationGain);
    }
  }
  
  /**
   * Start the binaural beat generation
   */
  start() {
    if (!this.initialized || this.isPlaying) return;
    
    // Start oscillators
    this.leftOscillator.start();
    this.rightOscillator.start();
    
    // Start modulator if exists
    if (this.modulator) {
      this.modulator.start();
    }
    
    this.isPlaying = true;
    console.log('BinauralGenerator started');
  }
  
  /**
   * Stop the binaural beat generation
   */
  stop() {
    if (!this.initialized || !this.isPlaying) return;
    
    // Stop oscillators
    this.leftOscillator.stop();
    this.rightOscillator.stop();
    
    // Stop modulator if exists
    if (this.modulator) {
      this.modulator.stop();
    }
    
    this.isPlaying = false;
    console.log('BinauralGenerator stopped');
  }
  
  /**
   * Update parameters
   * @param {Object} parameters - New parameters
   * @param {number} transitionTime - Transition time in seconds
   */
  setParameters(parameters, transitionTime = 0.1) {
    const oldParams = { ...this.parameters };
    
    // Update parameters object with new values
    Object.assign(this.parameters, parameters);
    
    // Apply parameters to audio nodes
    if (this.initialized) {
      const currentTime = this.context.currentTime;
      const transitionEnd = currentTime + transitionTime;
      
      // Update master volume
      if (parameters.volume !== undefined && this.masterGain) {
        this.masterGain.gain.cancelScheduledValues(currentTime);
        this.masterGain.gain.linearRampToValueAtTime(parameters.volume, transitionEnd);
      }
      
      // Update panning
      if (parameters.panning !== undefined) {
        if (this.leftPanner) {
          this.leftPanner.pan.cancelScheduledValues(currentTime);
          this.leftPanner.pan.linearRampToValueAtTime(-parameters.panning, transitionEnd);
        }
        if (this.rightPanner) {
          this.rightPanner.pan.cancelScheduledValues(currentTime);
          this.rightPanner.pan.linearRampToValueAtTime(parameters.panning, transitionEnd);
        }
      }
      
      // Update frequencies
      if (parameters.carrierFrequency !== undefined || parameters.beatFrequency !== undefined) {
        // Recalculate frequencies
        const leftFreq = this.parameters.carrierFrequency - (this.parameters.beatFrequency / 2);
        const rightFreq = this.parameters.carrierFrequency + (this.parameters.beatFrequency / 2);
        
        if (this.leftOscillator) {
          this.leftOscillator.frequency.cancelScheduledValues(currentTime);
          this.leftOscillator.frequency.exponentialRampToValueAtTime(leftFreq, transitionEnd);
        }
        
        if (this.rightOscillator) {
          this.rightOscillator.frequency.cancelScheduledValues(currentTime);
          this.rightOscillator.frequency.exponentialRampToValueAtTime(rightFreq, transitionEnd);
        }
      }
      
      // Update waveform type
      if (parameters.waveform !== undefined) {
        if (this.leftOscillator) this.leftOscillator.type = parameters.waveform;
        if (this.rightOscillator) this.rightOscillator.type = parameters.waveform;
      }
      
      // Update modulation
      if (parameters.modulationRate !== undefined && this.modulator) {
        this.modulator.frequency.cancelScheduledValues(currentTime);
        this.modulator.frequency.exponentialRampToValueAtTime(parameters.modulationRate, transitionEnd);
      }
      
      // If modulation type changed, we need to recreate the modulation setup
      if (parameters.modulation !== undefined && parameters.modulation !== oldParams.modulation) {
        // Remove old modulation
        if (this.modulator) {
          this.modulator.stop();
          this.modulator.dispose();
          this.modulator = null;
        }
        
        // Setup new modulation if needed
        if (parameters.modulation !== 'none') {
          this.setupModulation();
          if (this.isPlaying) {
            this.modulator.start();
          }
        }
      }
      
      // Monitor performance after parameter changes
      this.metrics.updateCount++;
    }
  }
  
  /**
   * Configure the generator with a new configuration
   * @param {Object} config - New configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Extract parameters from config
    const parameters = {};
    if (config.carrierFrequency !== undefined) parameters.carrierFrequency = config.carrierFrequency;
    if (config.beatFrequency !== undefined) parameters.beatFrequency = config.beatFrequency;
    if (config.waveform !== undefined) parameters.waveform = config.waveform;
    if (config.volume !== undefined) parameters.volume = config.volume;
    if (config.panning !== undefined) parameters.panning = config.panning;
    if (config.modulation !== undefined) parameters.modulation = config.modulation;
    if (config.modulationRate !== undefined) parameters.modulationRate = config.modulationRate;
    if (config.modulationDepth !== undefined) parameters.modulationDepth = config.modulationDepth;
    
    // Apply parameters
    if (Object.keys(parameters).length > 0) {
      this.setParameters(parameters);
    }
  }
  
  /**
   * Start CPU load monitoring
   */
  startPerformanceMonitoring() {
    // Check CPU usage every 2 seconds
    setInterval(() => {
      if (this.context && typeof this.context.getOutputTimestamp === 'function') {
        const usage = Tone.context.rawContext.getOutputTimestamp();
        this.metrics.cpuLoad = usage.contextTime / usage.performanceTime;
      }
    }, 2000);
  }
  
  /**
   * Create a preset for specific brain state
   * @param {string} state - Brain state ('delta', 'theta', 'alpha', 'beta', 'gamma')
   * @returns {Object} - Parameter preset
   */
  static createBrainwavePreset(state) {
    // Define frequency ranges for each brainwave state
    const ranges = {
      delta: { min: 0.5, max: 4, carrier: 256, modulation: 'none' },
      theta: { min: 4, max: 8, carrier: 288, modulation: 'am' },
      alpha: { min: 8, max: 13, carrier: 432, modulation: 'none' },
      beta: { min: 13, max: 30, carrier: 528, modulation: 'fm' },
      gamma: { min: 30, max: 50, carrier: 639, modulation: 'am' }
    };
    
    // Get range for requested state or default to alpha
    const range = ranges[state.toLowerCase()] || ranges.alpha;
    
    // Generate a frequency within the range
    const beatFrequency = range.min + Math.random() * (range.max - range.min);
    
    // Create and return parameters
    return {
      carrierFrequency: range.carrier,
      beatFrequency: beatFrequency,
      waveform: 'sine',
      volume: 0.3,
      panning: 0.7,
      modulation: range.modulation,
      modulationRate: beatFrequency / 4,
      modulationDepth: 0.3
    };
  }
  
  /**
   * Get current parameters
   * @returns {Object} - Current parameters
   */
  getParameters() {
    return { ...this.parameters };
  }
  
  /**
   * Get performance metrics
   * @returns {Object} - Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Check if generator is playing
   * @returns {boolean} - True if playing
   */
  isActive() {
    return this.isPlaying;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    
    // Dispose audio nodes
    if (this.leftOscillator) this.leftOscillator.dispose();
    if (this.rightOscillator) this.rightOscillator.dispose();
    if (this.leftGain) this.leftGain.dispose();
    if (this.rightGain) this.rightGain.dispose();
    if (this.leftPanner) this.leftPanner.dispose();
    if (this.rightPanner) this.rightPanner.dispose();
    if (this.masterGain) this.masterGain.dispose();
    if (this.modulator) this.modulator.dispose();
    
    this.initialized = false;
    this.isPlaying = false;
    
    console.log('BinauralGenerator disposed');
  }
}

export default BinauralGenerator;