/**
 * AudioEngine.js
 * 
 * Handles all audio generation, synthesis, and analysis.
 * Uses Web Audio API and Tone.js for advanced audio processing.
 */

await Tone.start()
import { Performance } from '../utils/Performance';
import { BinauralGenerator } from './synthesis/BinauralGenerator';
import { Harmonics } from './synthesis/Harmonics';
import { FrequencyAnalyzer } from './analysis/FrequencyAnalyzer';
import { BeatDetector } from './analysis/BeatDetector';

export class AudioEngine {
  /**
   * Initialize the AudioEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.initialized = false;
    this.isRunning = false;
    this.isMuted = false;
    
    // Audio context and main output
    this.context = null;
    this.masterOutput = null;
    
    // Analysis nodes
    this.analyzer = null;
    this.frequencyData = null;
    this.waveformData = null;
    
    // Audio modules
    this.modules = {
      binaural: null,
      harmonics: null,
      analyzer: null,
      beatDetector: null
    };
    
    // Oscillators and sound generators
    this.oscillators = [];
    
    // Current parameters
    this.parameters = {
      baseFrequency: 432,
      volume: 0.5,
      binauralBeat: 7.83, // Schumann resonance
      harmonicRatios: [1, 1.5, 2, 2.5, 3, 4, 5, 6],
      tempo: 60,
      pulseRate: 0.25,
      filterCutoff: 1000,
      filterResonance: 1,
      reverbDecay: 1.5,
      delayTime: 0.5,
      delayFeedback: 0.3
    };
    
    // Analysis results
    this.analysisResults = {
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      peaks: [],
      isBeat: false,
      spectrum: []
    };
    
    // Event callbacks
    this.eventHandlers = {
      onAnalysis: [],
      onBeat: [],
      onParameterChange: []
    };
    
    // Analysis loop
    this.analysisInterval = null;
  }
  
  /**
   * Initialize the audio engine
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('audio-init-start');
    
    try {
      // Ensure audio context is created with user interaction
      console.log('Audio engine initializing...');
      
      // Initialize Tone.js
      await Tone.start();
      this.context = Tone.context;
      console.log('Audio context started');
      
      // Create master output with limiter for safety
      this.masterOutput = new Tone.Limiter(-3).toDestination();
      
      // Create analyzer node
      this.analyzer = new Tone.Analyser({
        type: 'fft',
        size: 1024,
        smoothing: 0.8
      });
      this.analyzer.connect(this.masterOutput);
      
      // Create waveform analyzer
      this.waveformAnalyzer = new Tone.Analyser({
        type: 'waveform',
        size: 1024
      });
      this.waveformAnalyzer.connect(this.masterOutput);
      
      // Initialize frequency analysis buffers
      this.frequencyData = new Uint8Array(this.analyzer.size);
      this.waveformData = new Uint8Array(this.waveformAnalyzer.size);
      
      // Initialize audio modules
      await this.initializeModules();
      
      // Apply initial configuration
      this.updateFromConfig();
      
      this.initialized = true;
      
      Performance.mark('audio-init-end');
      Performance.measure('audio-initialization', 'audio-init-start', 'audio-init-end');
      
      console.log('Audio engine initialized successfully', Performance.getLastMeasure('audio-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Initialize audio processing modules
   * @returns {Promise} - Resolves when all modules are initialized
   */
  async initializeModules() {
    // Initialize BinauralGenerator for binaural beats
    this.modules.binaural = new BinauralGenerator({
      context: this.context,
      output: this.analyzer,
      config: this.config.binaural
    });
    await this.modules.binaural.initialize();
    
    // Initialize Harmonics generator for harmonic series
    this.modules.harmonics = new Harmonics({
      context: this.context,
      output: this.analyzer,
      config: this.config.harmonics
    });
    await this.modules.harmonics.initialize();
    
    // Initialize frequency analyzer
    this.modules.analyzer = new FrequencyAnalyzer({
      context: this.context,
      analyzer: this.analyzer,
      config: this.config.analysis
    });
    await this.modules.analyzer.initialize();
    
    // Initialize beat detector
    this.modules.beatDetector = new BeatDetector({
      context: this.context,
      analyzer: this.analyzer,
      config: this.config.beatDetection
    });
    await this.modules.beatDetector.initialize();
    
    // Initialize effects
    this.reverb = new Tone.Reverb({
      decay: this.parameters.reverbDecay,
      wet: 0.3
    }).connect(this.analyzer);
    
    this.delay = new Tone.PingPongDelay({
      delayTime: this.parameters.delayTime,
      feedback: this.parameters.delayFeedback,
      wet: 0.2
    }).connect(this.reverb);
    
    this.filter = new Tone.Filter({
      frequency: this.parameters.filterCutoff,
      type: 'lowpass',
      Q: this.parameters.filterResonance
    }).connect(this.delay);
    
    return Promise.resolve();
  }
  
  /**
   * Update from configuration object
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Update parameters from config
    if (this.config.baseFrequency) this.parameters.baseFrequency = this.config.baseFrequency;
    if (this.config.volume !== undefined) this.parameters.volume = this.config.volume;
    if (this.config.binauralBeat) this.parameters.binauralBeat = this.config.binauralBeat;
    if (this.config.harmonicRatios) this.parameters.harmonicRatios = [...this.config.harmonicRatios];
    if (this.config.tempo) this.parameters.tempo = this.config.tempo;
    if (this.config.pulseRate) this.parameters.pulseRate = this.config.pulseRate;
    if (this.config.filterCutoff) this.parameters.filterCutoff = this.config.filterCutoff;
    if (this.config.filterResonance) this.parameters.filterResonance = this.config.filterResonance;
    if (this.config.reverbDecay) this.parameters.reverbDecay = this.config.reverbDecay;
    if (this.config.delayTime) this.parameters.delayTime = this.config.delayTime;
    if (this.config.delayFeedback) this.parameters.delayFeedback = this.config.delayFeedback;
    
    // Update master volume
    if (this.masterOutput) {
      Tone.Destination.volume.value = Tone.gainToDb(this.parameters.volume);
    }
    
    // Update effects
    if (this.reverb) {
      this.reverb.decay = this.parameters.reverbDecay;
    }
    
    if (this.delay) {
      this.delay.delayTime.value = this.parameters.delayTime;
      this.delay.feedback.value = this.parameters.delayFeedback;
    }
    
    if (this.filter) {
      this.filter.frequency.value = this.parameters.filterCutoff;
      this.filter.Q.value = this.parameters.filterResonance;
    }
    
    // Update modules
    if (this.modules.binaural) {
      this.modules.binaural.setParameters({
        carrierFrequency: this.parameters.baseFrequency,
        beatFrequency: this.parameters.binauralBeat
      });
    }
    
    if (this.modules.harmonics) {
      this.modules.harmonics.setParameters({
        baseFrequency: this.parameters.baseFrequency,
        ratios: this.parameters.harmonicRatios
      });
    }
  }
  
  /**
   * Start the audio engine
   */
  start() {
    if (!this.initialized || this.isRunning) return;
    
    console.log('Starting audio engine...');
    
    // Start analysis loop
    this.startAnalysis();
    
    // Start audio modules
    if (this.modules.binaural) this.modules.binaural.start();
    if (this.modules.harmonics) this.modules.harmonics.start();
    
    // Create a pulse if tempo is set
    if (this.parameters.tempo > 0) {
      this.startPulse();
    }
    
    this.isRunning = true;
    console.log('Audio engine started');
  }
  
  /**
   * Stop the audio engine
   */
  stop() {
    if (!this.initialized || !this.isRunning) return;
    
    console.log('Stopping audio engine...');
    
    // Stop analysis loop
    this.stopAnalysis();
    
    // Stop audio modules
    if (this.modules.binaural) this.modules.binaural.stop();
    if (this.modules.harmonics) this.modules.harmonics.stop();
    
    // Stop any pulse
    this.stopPulse();
    
    this.isRunning = false;
    console.log('Audio engine stopped');
  }
  
  /**
   * Pause audio (but keep engine running)
   */
  pause() {
    if (!this.initialized || !this.isRunning) return;
    
    Tone.Destination.mute = true;
    this.isMuted = true;
    console.log('Audio paused');
  }
  
  /**
   * Resume audio after pause
   */
  resume() {
    if (!this.initialized || !this.isRunning) return;
    
    Tone.Destination.mute = false;
    this.isMuted = false;
    console.log('Audio resumed');
  }
  
  /**
   * Start a rhythmic pulse
   */
  startPulse() {
    const pulseInterval = (60 / this.parameters.tempo) * this.parameters.pulseRate;
    
    this.pulseSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    }).connect(this.filter);
    
    // Create a pulse loop
    this.pulseLoop = new Tone.Loop(time => {
      this.pulseSynth.triggerAttackRelease(
        this.parameters.baseFrequency / 4, 
        '16n', 
        time, 
        0.1 + (this.analysisResults.bass * 0.2)
      );
      
      // Trigger beat event
      this.dispatchEvent('onBeat', { time });
      
    }, pulseInterval).start(0);
    
    console.log(`Pulse started at ${this.parameters.tempo} BPM, rate: ${this.parameters.pulseRate}`);
  }
  
  /**
   * Stop the rhythmic pulse
   */
  stopPulse() {
    if (this.pulseLoop) {
      this.pulseLoop.stop();
      this.pulseLoop.dispose();
      this.pulseLoop = null;
    }
    
    if (this.pulseSynth) {
      this.pulseSynth.dispose();
      this.pulseSynth = null;
    }
  }
  
  /**
   * Start audio analysis loop
   */
  startAnalysis() {
    // Clear any existing interval
    this.stopAnalysis();
    
    // Start a new analysis loop
    this.analysisInterval = setInterval(() => {
      this.analyze();
    }, 100); // 10 times per second
  }
  
  /**
   * Stop audio analysis loop
   */
  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }
  
  /**
   * Perform audio analysis
   */
  analyze() {
    if (!this.initialized || !this.analyzer) return;
    
    Performance.startMeasure('audio-analysis');
    
    // Get frequency data
    this.frequencyData = this.analyzer.getValue();
    
    // Get waveform data
    this.waveformData = this.waveformAnalyzer.getValue();
    
    // Analyze frequency bands
    const analysis = this.modules.analyzer.analyze(this.frequencyData);
    
    // Detect beats
    const beatInfo = this.modules.beatDetector.detect(this.frequencyData);
    
    // Update analysis results
    this.analysisResults = {
      ...analysis,
      ...beatInfo,
      spectrum: Array.from(this.frequencyData),
      waveform: Array.from(this.waveformData)
    };
    
    // Trigger onAnalysis event
    this.dispatchEvent('onAnalysis', this.analysisResults);
    
    // Trigger onBeat event if a beat is detected
    if (beatInfo.isBeat) {
      this.dispatchEvent('onBeat', beatInfo);
    }
    
    Performance.endMeasure('audio-analysis');
  }
  
  /**
   * Set a single audio parameter
   * @param {string} name - Parameter name
   * @param {any} value - Parameter value
   * @returns {boolean} - Success status
   */
  setParameter(name, value) {
    if (name in this.parameters) {
      const oldValue = this.parameters[name];
      this.parameters[name] = value;
      
      // Apply parameter change
      this.applyParameterChange(name, value);
      
      // Notify listeners
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
   * @param {Object} params - Parameters object
   * @returns {Object} - Success status for each parameter
   */
  setParameters(params) {
    const results = {};
    
    for (const [name, value] of Object.entries(params)) {
      results[name] = this.setParameter(name, value);
    }
    
    return results;
  }
  
  /**
   * Apply a parameter change to the appropriate audio component
   * @param {string} name - Parameter name
   * @param {any} value - Parameter value
   */
  applyParameterChange(name, value) {
    switch (name) {
      case 'baseFrequency':
        if (this.modules.binaural) {
          this.modules.binaural.setParameters({ carrierFrequency: value });
        }
        if (this.modules.harmonics) {
          this.modules.harmonics.setParameters({ baseFrequency: value });
        }
        break;
        
      case 'binauralBeat':
        if (this.modules.binaural) {
          this.modules.binaural.setParameters({ beatFrequency: value });
        }
        break;
        
      case 'harmonicRatios':
        if (this.modules.harmonics) {
          this.modules.harmonics.setParameters({ ratios: value });
        }
        break;
        
      case 'volume':
        Tone.Destination.volume.value = Tone.gainToDb(value);
        break;
        
      case 'tempo':
        if (this.isRunning) {
          this.stopPulse();
          if (value > 0) {
            this.startPulse();
          }
        }
        break;
        
      case 'pulseRate':
        if (this.isRunning && this.parameters.tempo > 0) {
          this.stopPulse();
          this.startPulse();
        }
        break;
        
      case 'filterCutoff':
        if (this.filter) {
          this.filter.frequency.value = value;
        }
        break;
        
      case 'filterResonance':
        if (this.filter) {
          this.filter.Q.value = value;
        }
        break;
        
      case 'reverbDecay':
        if (this.reverb) {
          this.reverb.decay = value;
        }
        break;
        
      case 'delayTime':
        if (this.delay) {
          this.delay.delayTime.value = value;
        }
        break;
        
      case 'delayFeedback':
        if (this.delay) {
          this.delay.feedback.value = value;
        }
        break;
    }
  }
  
  /**
   * Apply a sound preset
   * @param {Object} preset - Sound preset
   * @returns {boolean} - Success status
   */
  applyPreset(preset) {
    if (!preset) return false;
    
    try {
      // Apply parameters
      if (preset.parameters) {
        this.setParameters(preset.parameters);
      }
      
      // Apply additional settings specific to modules
      if (preset.binaural && this.modules.binaural) {
        this.modules.binaural.configure(preset.binaural);
      }
      
      if (preset.harmonics && this.modules.harmonics) {
        this.modules.harmonics.configure(preset.harmonics);
      }
      
      if (preset.effects) {
        if (preset.effects.reverb && this.reverb) {
          this.reverb.wet.value = preset.effects.reverb.wet || 0.3;
          if (preset.effects.reverb.decay) {
            this.reverb.decay = preset.effects.reverb.decay;
          }
        }
        
        if (preset.effects.delay && this.delay) {
          this.delay.wet.value = preset.effects.delay.wet || 0.2;
          if (preset.effects.delay.delayTime) {
            this.delay.delayTime.value = preset.effects.delay.delayTime;
          }
          if (preset.effects.delay.feedback) {
            this.delay.feedback.value = preset.effects.delay.feedback;
          }
        }
        
        if (preset.effects.filter && this.filter) {
          if (preset.effects.filter.type) {
            this.filter.type = preset.effects.filter.type;
          }
          if (preset.effects.filter.frequency) {
            this.filter.frequency.value = preset.effects.filter.frequency;
          }
          if (preset.effects.filter.Q) {
            this.filter.Q.value = preset.effects.filter.Q;
          }
        }
      }
      
      console.log('Applied audio preset:', preset.name || 'unnamed');
      return true;
    } catch (error) {
      console.error('Failed to apply audio preset:', error);
      return false;
    }
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
   * Get current audio analysis results
   * @returns {Object} - Analysis results
   */
  getAnalysisResults() {
    return { ...this.analysisResults };
  }
  
  /**
   * Get raw frequency data
   * @returns {Uint8Array} - Frequency data
   */
  getFrequencyData() {
    return this.frequencyData;
  }
  
  /**
   * Get raw waveform data
   * @returns {Uint8Array} - Waveform data
   */
  getWaveformData() {
    return this.waveformData;
  }
  
  /**
   * Get the current state of the audio engine
   * @returns {Object} - Current state
   */
  getState() {
    return {
      initialized: this.initialized,
      isRunning: this.isRunning,
      isMuted: this.isMuted,
      parameters: { ...this.parameters },
      analysis: { ...this.analysisResults }
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.stopAnalysis();
    
    // Dispose modules
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.dispose === 'function') {
        module.dispose();
      }
    });
    
    // Dispose effects
    if (this.reverb) this.reverb.dispose();
    if (this.delay) this.delay.dispose();
    if (this.filter) this.filter.dispose();
    if (this.analyzer) this.analyzer.dispose();
    if (this.waveformAnalyzer) this.waveformAnalyzer.dispose();
    if (this.masterOutput) this.masterOutput.dispose();
    
    // Clear event handlers
    Object.keys(this.eventHandlers).forEach(event => {
      this.eventHandlers[event] = [];
    });
    
    this.initialized = false;
    console.log('Audio engine disposed');
  }
}

export default AudioEngine;