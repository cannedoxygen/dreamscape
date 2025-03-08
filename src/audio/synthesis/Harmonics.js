/**
 * Harmonics.js
 * 
 * Generates harmonic series based on a base frequency.
 * The harmonic series is a sequence of frequencies that are integer multiples
 * of a fundamental frequency. This creates rich, natural-sounding tones
 * based on the physics of sound.
 * 
 * The harmonic series can also be modified with different ratios to create
 * various musical scales and tonal systems.
 */

await Tone.start()
import { Performance } from '../../utils/Performance';

export class Harmonics {
  /**
   * Initialize the harmonics generator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.context = options.context || Tone.context;
    this.output = options.output || Tone.Destination;
    this.config = options.config || {};
    
    // Default parameters
    this.parameters = {
      baseFrequency: this.config.baseFrequency || 432, // Base frequency in Hz
      ratios: this.config.ratios || [1, 1.5, 2, 2.5, 3, 4, 5, 6], // Harmonic ratios
      baseWaveform: this.config.baseWaveform || 'sine', // Fundamental waveform
      overtoneWaveform: this.config.overtoneWaveform || 'sine', // Overtone waveform
      volume: this.config.volume !== undefined ? this.config.volume : 0.3,
      overtoneCount: this.config.overtoneCount || 6, // Number of overtones to generate
      overtoneDecay: this.config.overtoneDecay || 0.7, // How quickly overtone volume decreases
      spread: this.config.spread || 0.5, // Stereo spread (0-1)
      detune: this.config.detune || 0, // Slight detuning for thickness
      attack: this.config.attack || 0.2, // Attack time in seconds
      release: this.config.release || 1, // Release time in seconds
      modulation: this.config.modulation || 'none', // 'none', 'am', 'fm'
      modulationRate: this.config.modulationRate || 0.1, // Modulation speed in Hz
      modulationDepth: this.config.modulationDepth || 0.3 // Modulation intensity
    };
    
    // Audio nodes
    this.masterGain = null;
    this.oscillators = [];
    this.modulators = [];
    
    // State
    this.initialized = false;
    this.isPlaying = false;
    
    // Performance metrics
    this.metrics = {
      oscillatorCount: 0,
      cpuLoad: 0,
      updateCount: 0
    };
  }
  
  /**
   * Initialize the harmonics generator
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('harmonics-init-start');
    
    try {
      console.log('Initializing Harmonics generator...');
      
      // Create master gain for volume control
      this.masterGain = new Tone.Gain(this.parameters.volume).connect(this.output);
      
      // Create oscillators for each harmonic
      await this.createOscillators();
      
      // Set up modulation if needed
      if (this.parameters.modulation !== 'none') {
        this.setupModulation();
      }
      
      this.initialized = true;
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      Performance.mark('harmonics-init-end');
      Performance.measure('harmonics-initialization', 'harmonics-init-start', 'harmonics-init-end');
      
      console.log('Harmonics generator initialized', Performance.getLastMeasure('harmonics-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Harmonics generator:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Create oscillators for all harmonics
   * @returns {Promise} - Resolves when oscillators are created
   */
  async createOscillators() {
    // Clean up any existing oscillators
    this.disposeOscillators();
    
    // Get number of harmonics to generate
    const harmonicCount = Math.min(
      this.parameters.ratios.length,
      this.parameters.overtoneCount
    );
    
    // Create an oscillator for each harmonic
    for (let i = 0; i < harmonicCount; i++) {
      const ratio = this.parameters.ratios[i];
      const frequency = this.parameters.baseFrequency * ratio;
      
      // Calculate volume for this harmonic (decreasing with higher harmonics)
      const volume = i === 0 
        ? 1 // Fundamental frequency at full volume
        : Math.pow(this.parameters.overtoneDecay, i); // Overtones decrease in volume
      
      // Select waveform (fundamental vs overtone)
      const waveform = i === 0 
        ? this.parameters.baseWaveform 
        : this.parameters.overtoneWaveform;
      
      // Create panner for stereo positioning
      const panner = new Tone.Panner(0).connect(this.masterGain);
      
      // Create envelope for smooth onset/offset
      const envelope = new Tone.AmplitudeEnvelope({
        attack: this.parameters.attack,
        decay: 0.1,
        sustain: 1,
        release: this.parameters.release
      }).connect(panner);
      
      // Create oscillator
      const oscillator = new Tone.Oscillator({
        frequency: frequency,
        type: waveform,
        volume: Tone.gainToDb(volume)
      }).connect(envelope);
      
      // Add random detune for thickness if specified
      if (this.parameters.detune !== 0) {
        const detune = (Math.random() * 2 - 1) * this.parameters.detune;
        oscillator.detune.value = detune;
      }
      
      // Calculate pan position with progressive spreading from center
      let pan = 0;
      if (i > 0 && this.parameters.spread > 0) {
        // Alternate left and right for harmonics
        const direction = i % 2 === 0 ? 1 : -1; 
        // Higher harmonics spread more
        const spreadFactor = (i / harmonicCount) * this.parameters.spread; 
        pan = direction * spreadFactor;
      }
      panner.pan.value = pan;
      
      // Store oscillator and related nodes
      this.oscillators.push({
        oscillator,
        envelope,
        panner,
        frequency,
        ratio,
        volume,
        pan
      });
    }
    
    // Update metrics
    this.metrics.oscillatorCount = this.oscillators.length;
    
    return Promise.resolve();
  }
  
  /**
   * Setup modulation for oscillators
   */
  setupModulation() {
    // Create a modulator for each oscillator
    this.oscillators.forEach((osc, index) => {
      // Modulation rate with slight variations for each harmonic
      const rate = this.parameters.modulationRate * (1 + (index * 0.1));
      
      // Create the modulator oscillator
      const modulator = new Tone.Oscillator({
        frequency: rate,
        type: 'sine'
      });
      
      // Scale modulation depth based on harmonic (deeper for lower harmonics)
      const depth = this.parameters.modulationDepth * (1 - (index * 0.1));
      
      if (this.parameters.modulation === 'am') {
        // Amplitude modulation
        const modulationGain = new Tone.Gain(depth);
        modulator.connect(modulationGain);
        
        // Connect to oscillator gain
        modulationGain.connect(osc.envelope.gain);
        
        // Scale and offset to prevent negative gain
        osc.envelope.gain.value = 1 - depth;
      } else if (this.parameters.modulation === 'fm') {
        // Frequency modulation - scale depth by frequency
        const modulationAmount = depth * osc.frequency * 0.1; // 10% frequency deviation
        
        // Create gain node for modulation amount
        const modulationGain = new Tone.Gain(modulationAmount);
        modulator.connect(modulationGain);
        
        // Connect to oscillator frequency
        modulationGain.connect(osc.oscillator.frequency);
      }
      
      // Store modulator
      this.modulators.push(modulator);
    });
  }
  
  /**
   * Start the harmonics generator
   */
  start() {
    if (!this.initialized || this.isPlaying) return;
    
    // Start oscillators
    this.oscillators.forEach(osc => {
      osc.oscillator.start();
      osc.envelope.triggerAttack('+0.05'); // Slight delay for smoother start
    });
    
    // Start modulators if they exist
    this.modulators.forEach(modulator => {
      modulator.start();
    });
    
    this.isPlaying = true;
    console.log('Harmonics generator started');
  }
  
  /**
   * Stop the harmonics generator
   */
  stop() {
    if (!this.initialized || !this.isPlaying) return;
    
    // Smoothly release all oscillators
    this.oscillators.forEach(osc => {
      osc.envelope.triggerRelease();
    });
    
    // Schedule actual stopping after release time
    setTimeout(() => {
      this.oscillators.forEach(osc => {
        osc.oscillator.stop();
      });
      
      this.modulators.forEach(modulator => {
        modulator.stop();
      });
      
      this.isPlaying = false;
    }, this.parameters.release * 1000 + 100); // Add a little extra time
    
    console.log('Harmonics generator stopping (with release)');
  }
  
  /**
   * Stop immediately (without release)
   */
  stopImmediately() {
    if (!this.initialized) return;
    
    this.oscillators.forEach(osc => {
      osc.oscillator.stop();
    });
    
    this.modulators.forEach(modulator => {
      modulator.stop();
    });
    
    this.isPlaying = false;
    console.log('Harmonics generator stopped immediately');
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
      
      // Update base frequency and/or ratios
      if (parameters.baseFrequency !== undefined || parameters.ratios !== undefined) {
        // If major change in ratios, recreate oscillators
        if (parameters.ratios !== undefined && 
            (parameters.ratios.length !== oldParams.ratios.length ||
             parameters.ratios.some((ratio, i) => oldParams.ratios[i] !== ratio))) {
          
          // Need to recreate oscillators for new ratio structure
          if (this.isPlaying) {
            // If playing, need to stop first
            this.stopImmediately();
            this.createOscillators().then(() => {
              if (this.parameters.modulation !== 'none') {
                this.setupModulation();
              }
              this.start();
            });
          } else {
            // If not playing, just recreate
            this.createOscillators().then(() => {
              if (this.parameters.modulation !== 'none') {
                this.setupModulation();
              }
            });
          }
        } else if (parameters.baseFrequency !== undefined) {
          // Just update frequencies based on new base frequency
          this.oscillators.forEach((osc, index) => {
            const ratio = this.parameters.ratios[index];
            const frequency = this.parameters.baseFrequency * ratio;
            
            osc.oscillator.frequency.cancelScheduledValues(currentTime);
            osc.oscillator.frequency.exponentialRampToValueAtTime(frequency, transitionEnd);
            
            // Update stored frequency
            osc.frequency = frequency;
          });
        }
      }
      
      // Update overtone count if changed
      if (parameters.overtoneCount !== undefined && 
          parameters.overtoneCount !== oldParams.overtoneCount) {
        // Need to recreate oscillators for different overtone count
        if (this.isPlaying) {
          // If playing, need to stop first
          this.stopImmediately();
          this.createOscillators().then(() => {
            if (this.parameters.modulation !== 'none') {
              this.setupModulation();
            }
            this.start();
          });
        } else {
          // If not playing, just recreate
          this.createOscillators().then(() => {
            if (this.parameters.modulation !== 'none') {
              this.setupModulation();
            }
          });
        }
      }
      
      // Update waveforms if changed
      if (parameters.baseWaveform !== undefined || parameters.overtoneWaveform !== undefined) {
        this.oscillators.forEach((osc, index) => {
          // Use appropriate waveform based on whether this is fundamental or overtone
          if (index === 0 && parameters.baseWaveform !== undefined) {
            osc.oscillator.type = parameters.baseWaveform;
          } else if (index > 0 && parameters.overtoneWaveform !== undefined) {
            osc.oscillator.type = parameters.overtoneWaveform;
          }
        });
      }
      
      // Update envelope parameters
      if (parameters.attack !== undefined || parameters.release !== undefined) {
        this.oscillators.forEach(osc => {
          if (parameters.attack !== undefined) {
            osc.envelope.attack = parameters.attack;
          }
          if (parameters.release !== undefined) {
            osc.envelope.release = parameters.release;
          }
        });
      }
      
      // Update stereo spread
      if (parameters.spread !== undefined) {
        this.oscillators.forEach((osc, index) => {
          if (index === 0) {
            // Keep fundamental centered
            osc.panner.pan.setValueAtTime(0, currentTime);
          } else {
            // Recalculate pan position with new spread
            const direction = index % 2 === 0 ? 1 : -1;
            const spreadFactor = (index / this.oscillators.length) * parameters.spread;
            const pan = direction * spreadFactor;
            
            osc.panner.pan.cancelScheduledValues(currentTime);
            osc.panner.pan.linearRampToValueAtTime(pan, transitionEnd);
            
            // Update stored pan value
            osc.pan = pan;
          }
        });
      }
      
      // If modulation type changed, we need to recreate the modulation setup
      if (parameters.modulation !== undefined && parameters.modulation !== oldParams.modulation) {
        // Stop and dispose old modulators
        this.modulators.forEach(modulator => {
          if (modulator.state === 'started') {
            modulator.stop();
          }
          modulator.dispose();
        });
        this.modulators = [];
        
        // Setup new modulation if needed
        if (parameters.modulation !== 'none') {
          this.setupModulation();
          
          // Start modulators if currently playing
          if (this.isPlaying) {
            this.modulators.forEach(modulator => {
              modulator.start();
            });
          }
        }
      }
      // Update modulation rate/depth if type didn't change
      else if (parameters.modulation !== 'none' && 
               (parameters.modulationRate !== undefined || parameters.modulationDepth !== undefined)) {
        // Apply updates to existing modulators
        this.updateModulation(parameters, transitionTime);
      }
      
      // Monitor performance after parameter changes
      this.metrics.updateCount++;
    }
  }
  
  /**
   * Update modulation parameters
   * @param {Object} parameters - New parameters
   * @param {number} transitionTime - Transition time in seconds
   */
  updateModulation(parameters, transitionTime = 0.1) {
    if (!this.modulators.length) return;
    
    const currentTime = this.context.currentTime;
    const transitionEnd = currentTime + transitionTime;
    
    this.modulators.forEach((modulator, index) => {
      // Update modulation rate with variations per harmonic
      if (parameters.modulationRate !== undefined) {
        const rate = parameters.modulationRate * (1 + (index * 0.1));
        modulator.frequency.cancelScheduledValues(currentTime);
        modulator.frequency.exponentialRampToValueAtTime(rate, transitionEnd);
      }
      
      // Depth adjustments would require restructuring the modulation graph,
      // which is complex for a live update. For significant depth changes,
      // it's simpler to recreate the modulation setup.
      if (parameters.modulationDepth !== undefined && 
          Math.abs(parameters.modulationDepth - this.parameters.modulationDepth) > 0.2) {
        // Major depth change - rebuild modulation
        if (this.isPlaying) {
          // Stop modulators
          this.modulators.forEach(mod => {
            mod.stop();
            mod.dispose();
          });
          this.modulators = [];
          
          // Rebuild modulation
          this.setupModulation();
          
          // Restart modulators
          this.modulators.forEach(mod => {
            mod.start();
          });
        } else {
          // If not playing, just rebuild
          this.modulators.forEach(mod => {
            mod.dispose();
          });
          this.modulators = [];
          this.setupModulation();
        }
      }
    });
  }
  
  /**
   * Configure the generator with a new configuration
   * @param {Object} config - New configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Extract parameters from config
    const parameters = {};
    if (config.baseFrequency !== undefined) parameters.baseFrequency = config.baseFrequency;
    if (config.ratios !== undefined) parameters.ratios = config.ratios;
    if (config.baseWaveform !== undefined) parameters.baseWaveform = config.baseWaveform;
    if (config.overtoneWaveform !== undefined) parameters.overtoneWaveform = config.overtoneWaveform;
    if (config.volume !== undefined) parameters.volume = config.volume;
    if (config.overtoneCount !== undefined) parameters.overtoneCount = config.overtoneCount;
    if (config.overtoneDecay !== undefined) parameters.overtoneDecay = config.overtoneDecay;
    if (config.spread !== undefined) parameters.spread = config.spread;
    if (config.detune !== undefined) parameters.detune = config.detune;
    if (config.attack !== undefined) parameters.attack = config.attack;
    if (config.release !== undefined) parameters.release = config.release;
    if (config.modulation !== undefined) parameters.modulation = config.modulation;
    if (config.modulationRate !== undefined) parameters.modulationRate = config.modulationRate;
    if (config.modulationDepth !== undefined) parameters.modulationDepth = config.modulationDepth;
    
    // Apply parameters
    if (Object.keys(parameters).length > 0) {
      this.setParameters(parameters);
    }
  }
  
  /**
   * Start monitoring performance
   */
  startPerformanceMonitoring() {
    // Simple monitoring for now - just count oscillators and updates
    this.metrics.oscillatorCount = this.oscillators.length;
    
    // Update CPU usage from audio context if available
    setInterval(() => {
      // Try to get audio context CPU usage
      if (Tone.context && Tone.context.rawContext && Tone.context.rawContext.getOutputTimestamp) {
        try {
          const performanceData = Tone.context.rawContext.getOutputTimestamp();
          if (performanceData.contextTime && performanceData.performanceTime) {
            this.metrics.cpuLoad = performanceData.contextTime / performanceData.performanceTime;
          }
        } catch (e) {
          // Some browsers might not support this API
        }
      }
    }, 2000);
  }
  
  /**
   * Create a harmonic series based on a musical scale
   * @param {string} scale - Scale type ('just', 'pythagorean', 'equal', 'pentatonic', etc.)
   * @returns {Array} - Array of frequency ratios
   */
  static getHarmonicRatios(scale = 'harmonic') {
    // Different ratio sets for various musical scales and tuning systems
    const ratioSets = {
      // Natural harmonic series
      'harmonic': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      
      // Just intonation (based on small integer ratios)
      'just': [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2],
      
      // Pythagorean tuning (based on perfect fifths)
      'pythagorean': [1, 9/8, 81/64, 4/3, 3/2, 27/16, 243/128, 2],
      
      // Equal temperament (modern standard tuning)
      'equal': [1, 1.059463, 1.122462, 1.189207, 1.259921, 1.334840, 1.414214, 1.498307,
                1.587401, 1.681793, 1.781797, 1.887749, 2],
      
      // Pentatonic scale (5-note scale common in many cultures)
      'pentatonic': [1, 9/8, 5/4, 3/2, 5/3, 2],
      
      // Fibonacci sequence ratios (interesting mathematical properties)
      'fibonacci': [1, 1, 2, 3, 5, 8, 13, 21].map(n => n / 1),
      
      // Golden ratio based (phi ≈ 1.618)
      'golden': [1, 1.618, 2.618, 4.236, 6.854, 11.09, 17.944, 29.034],
      
      // Bohlen-Pierce scale (non-octave based)
      'bohlen-pierce': [1, 1.08, 1.17, 1.27, 1.38, 1.49, 1.62, 1.75, 1.89, 2.05, 2.22, 2.41, 3]
    };
    
    // Return the requested ratio set or default to harmonic series
    return ratioSets[scale] || ratioSets.harmonic;
  }
  
  /**
   * Create a preset for a specific tonal character
   * @param {string} character - Tonal character ('bright', 'warm', 'ethereal', etc.)
   * @returns {Object} - Parameter preset
   */
  static createTonalPreset(character) {
    // Presets for different tonal characters
    const presets = {
      'bright': {
        baseFrequency: 440,
        ratios: [1, 2, 3, 4, 5, 6, 8, 10],
        baseWaveform: 'triangle',
        overtoneWaveform: 'sine',
        overtoneCount: 8,
        overtoneDecay: 0.8,
        spread: 0.7,
        detune: 2,
        modulation: 'none'
      },
      
      'warm': {
        baseFrequency: 220,
        ratios: [1, 2, 3, 3.5, 4, 5],
        baseWaveform: 'sine',
        overtoneWaveform: 'sine',
        overtoneCount: 6,
        overtoneDecay: 0.5,
        spread: 0.4,
        detune: 3,
        modulation: 'none'
      },
      
      'ethereal': {
        baseFrequency: 528,
        ratios: Harmonics.getHarmonicRatios('golden').slice(0, 6),
        baseWaveform: 'sine',
        overtoneWaveform: 'sine',
        overtoneCount: 6,
        overtoneDecay: 0.9,
        spread: 0.8,
        detune: 5,
        modulation: 'am',
        modulationRate: 0.5,
        modulationDepth: 0.2,
        attack: 0.4,
        release: 2.5
      },
      
      'bell': {
        baseFrequency: 440,
        ratios: [1, 2.756, 5.404, 8.196],
        baseWaveform: 'sine',
        overtoneWaveform: 'sine',
        overtoneCount: 4,
        overtoneDecay: 0.3,
        spread: 0.5,
        detune: 1,
        modulation: 'none',
        attack: 0.01,
        release: 4.0
      },
      
      'organ': {
        baseFrequency: 261.63, // Middle C
        ratios: [1, 2, 4, 8, 16],
        baseWaveform: 'square',
        overtoneWaveform: 'sine',
        overtoneCount: 5,
        overtoneDecay: 0.7,
        spread: 0.3,
        detune: 0.5,
        modulation: 'am',
        modulationRate: 6,
        modulationDepth: 0.1
      },
      
      'cosmic': {
        baseFrequency: 136.1, // A2
        ratios: [1, 1.618, 2.618, 4.236, 6.854],
        baseWaveform: 'sine',
        overtoneWaveform: 'sine',
        overtoneCount: 5,
        overtoneDecay: 0.9,
        spread: 0.9,
        detune: 7,
        modulation: 'fm',
        modulationRate: 0.1,
        modulationDepth: 0.4,
        attack: 0.5,
        release: 3.0
      }
    };
    
    // Return the requested preset or default to warm
    return presets[character] || presets.warm;
  }
  
  /**
   * Dispose all oscillators
   */
  disposeOscillators() {
    this.oscillators.forEach(osc => {
      osc.oscillator.dispose();
      osc.envelope.dispose();
      osc.panner.dispose();
    });
    
    this.oscillators = [];
    
    this.modulators.forEach(modulator => {
      modulator.dispose();
    });
    
    this.modulators = [];
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
    this.stopImmediately();
    
    // Dispose all oscillators
    this.disposeOscillators();
    
    // Dispose master gain
    if (this.masterGain) {
      this.masterGain.dispose();
      this.masterGain = null;
    }
    
    this.initialized = false;
    this.isPlaying = false;
    
    console.log('Harmonics generator disposed');
  }
}

export default Harmonics;