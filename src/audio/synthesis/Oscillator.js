/**
 * Oscillator.js
 * 
 * Provides basic sound generation with configurable waveforms,
 * frequency modulation, and amplitude envelopes.
 */

import * as Tone from 'tone';

export class Oscillator {
  /**
   * Initialize the Oscillator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.context = options.context;
    this.output = options.output || null;
    this.config = options.config || {};
    this.initialized = false;
    
    // Default parameters
    this.parameters = {
      frequency: this.config.frequency || 440,      // Base frequency in Hz
      waveform: this.config.waveform || 'sine',     // Oscillator waveform
      detune: this.config.detune || 0,              // Detune in cents
      volume: this.config.volume || 0.5,            // Volume (0-1)
      attack: this.config.attack || 0.01,           // Attack time in seconds
      decay: this.config.decay || 0.1,              // Decay time in seconds
      sustain: this.config.sustain || 0.5,          // Sustain level (0-1)
      release: this.config.release || 0.5,          // Release time in seconds
      frequencyModulation: this.config.frequencyModulation || 0, // FM depth
      pulseWidth: this.config.pulseWidth || 0.5     // Pulse width for 'pwm' waveform
    };
    
    // Oscillator instances
    this.oscillator = null;
    this.modulationOsc = null;
    
    // Envelope and gain control
    this.envelope = null;
    this.gain = null;
    
    // State
    this.isPlaying = false;
  }
  
  /**
   * Initialize the oscillator
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    if (this.initialized) return Promise.resolve();
    
    try {
      // Create volume control
      this.gain = new Tone.Gain(this.parameters.volume).connect(this.output || Tone.Destination);
      
      // Create amplitude envelope
      this.envelope = new Tone.AmplitudeEnvelope({
        attack: this.parameters.attack,
        decay: this.parameters.decay,
        sustain: this.parameters.sustain,
        release: this.parameters.release
      }).connect(this.gain);
      
      // Create frequency modulation oscillator if needed
      if (this.parameters.frequencyModulation > 0) {
        this.modulationOsc = new Tone.Oscillator({
          frequency: this.parameters.frequency * 2, // Default to 2x carrier frequency
          type: 'sine'
        });
        
        // Create modulation depth control
        this.modulationDepth = new Tone.Gain(this.parameters.frequencyModulation);
        this.modulationOsc.connect(this.modulationDepth);
      }
      
      // Create main oscillator
      this.oscillator = new Tone.Oscillator({
        frequency: this.parameters.frequency,
        type: this.parameters.waveform,
        detune: this.parameters.detune
      }).connect(this.envelope);
      
      // Connect frequency modulation if enabled
      if (this.modulationOsc) {
        this.modulationDepth.connect(this.oscillator.frequency);
      }
      
      // Set pulse width if applicable
      if (this.parameters.waveform === 'pwm' && this.oscillator.width) {
        this.oscillator.width.value = this.parameters.pulseWidth;
      }
      
      this.initialized = true;
      console.log('Oscillator initialized');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Oscillator:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Start the oscillator
   * @param {number} time - Start time in seconds (optional)
   */
  start(time) {
    if (!this.initialized || this.isPlaying) return;
    
    try {
      // Start oscillators
      this.oscillator.start(time);
      if (this.modulationOsc) {
        this.modulationOsc.start(time);
      }
      
      // Trigger envelope
      this.envelope.triggerAttack(time);
      
      this.isPlaying = true;
      console.log(`Oscillator started at frequency: ${this.parameters.frequency}Hz`);
    } catch (error) {
      console.error('Failed to start Oscillator:', error);
    }
  }
  
  /**
   * Stop the oscillator
   * @param {number} time - Stop time in seconds (optional)
   */
  stop(time) {
    if (!this.initialized || !this.isPlaying) return;
    
    try {
      // Trigger release
      this.envelope.triggerRelease(time);
      
      // Schedule full stop after release
      const releaseTime = time || Tone.now();
      const stopTime = releaseTime + this.parameters.release + 0.1;
      
      // Schedule oscillator stop
      this.oscillator.stop(stopTime);
      if (this.modulationOsc) {
        this.modulationOsc.stop(stopTime);
      }
      
      this.isPlaying = false;
      console.log('Oscillator stopped');
    } catch (error) {
      console.error('Failed to stop Oscillator:', error);
    }
  }
  
  /**
   * Trigger a note with attack and release
   * @param {number} duration - Note duration in seconds
   * @param {number} time - Start time in seconds (optional)
   */
  triggerNote(duration, time = Tone.now()) {
    if (!this.initialized) return;
    
    try {
      // Start if not already playing
      if (!this.isPlaying) {
        this.oscillator.start(time);
        if (this.modulationOsc) {
          this.modulationOsc.start(time);
        }
      }
      
      // Trigger envelope
      this.envelope.triggerAttackRelease(duration, time);
      
      console.log(`Oscillator triggered note for ${duration} seconds`);
    } catch (error) {
      console.error('Failed to trigger Oscillator note:', error);
    }
  }
  
  /**
   * Set oscillator frequency
   * @param {number} frequency - Frequency in Hz
   * @param {number} rampTime - Transition time in seconds (optional)
   */
  setFrequency(frequency, rampTime = 0) {
    if (!this.initialized) return;
    
    try {
      if (rampTime > 0) {
        this.oscillator.frequency.rampTo(frequency, rampTime);
        if (this.modulationOsc) {
          this.modulationOsc.frequency.rampTo(frequency * 2, rampTime);
        }
      } else {
        this.oscillator.frequency.value = frequency;
        if (this.modulationOsc) {
          this.modulationOsc.frequency.value = frequency * 2;
        }
      }
      
      this.parameters.frequency = frequency;
    } catch (error) {
      console.error('Failed to set oscillator frequency:', error);
    }
  }
  
  /**
   * Set oscillator volume
   * @param {number} volume - Volume level (0-1)
   * @param {number} rampTime - Transition time in seconds (optional)
   */
  setVolume(volume, rampTime = 0) {
    if (!this.initialized) return;
    
    try {
      volume = Math.max(0, Math.min(1, volume));
      
      if (rampTime > 0) {
        this.gain.gain.rampTo(volume, rampTime);
      } else {
        this.gain.gain.value = volume;
      }
      
      this.parameters.volume = volume;
    } catch (error) {
      console.error('Failed to set oscillator volume:', error);
    }
  }
  
  /**
   * Set oscillator waveform
   * @param {string} waveform - Waveform type ('sine', 'square', 'sawtooth', 'triangle', 'pwm')
   */
  setWaveform(waveform) {
    if (!this.initialized) return;
    
    try {
      this.oscillator.type = waveform;
      this.parameters.waveform = waveform;
      
      // Update pulse width if applicable
      if (waveform === 'pwm' && this.oscillator.width) {
        this.oscillator.width.value = this.parameters.pulseWidth;
      }
    } catch (error) {
      console.error('Failed to set oscillator waveform:', error);
    }
  }
  
  /**
   * Set envelope parameters
   * @param {Object} envelope - Envelope parameters {attack, decay, sustain, release}
   */
  setEnvelope(envelope = {}) {
    if (!this.initialized) return;
    
    try {
      if (envelope.attack !== undefined) {
        this.envelope.attack = envelope.attack;
        this.parameters.attack = envelope.attack;
      }
      
      if (envelope.decay !== undefined) {
        this.envelope.decay = envelope.decay;
        this.parameters.decay = envelope.decay;
      }
      
      if (envelope.sustain !== undefined) {
        this.envelope.sustain = envelope.sustain;
        this.parameters.sustain = envelope.sustain;
      }
      
      if (envelope.release !== undefined) {
        this.envelope.release = envelope.release;
        this.parameters.release = envelope.release;
      }
    } catch (error) {
      console.error('Failed to set oscillator envelope:', error);
    }
  }
  
  /**
   * Set frequency modulation parameters
   * @param {Object} modulation - Modulation parameters {depth, ratio}
   */
  setFrequencyModulation(modulation = {}) {
    if (!this.initialized) return;
    
    try {
      // Update modulation depth
      if (modulation.depth !== undefined) {
        if (this.modulationDepth) {
          this.modulationDepth.gain.value = modulation.depth;
          this.parameters.frequencyModulation = modulation.depth;
        } else if (modulation.depth > 0) {
          // Create modulation system if it doesn't exist and depth is non-zero
          this.modulationOsc = new Tone.Oscillator({
            frequency: this.parameters.frequency * 2,
            type: 'sine'
          });
          
          this.modulationDepth = new Tone.Gain(modulation.depth);
          this.modulationOsc.connect(this.modulationDepth);
          this.modulationDepth.connect(this.oscillator.frequency);
          
          if (this.isPlaying) {
            this.modulationOsc.start();
          }
          
          this.parameters.frequencyModulation = modulation.depth;
        }
      }
      
      // Update frequency ratio
      if (modulation.ratio !== undefined && this.modulationOsc) {
        this.modulationOsc.frequency.value = this.parameters.frequency * modulation.ratio;
      }
    } catch (error) {
      console.error('Failed to set frequency modulation:', error);
    }
  }
  
  /**
   * Set oscillator parameters
   * @param {Object} params - Parameters to update
   */
  setParameters(params = {}) {
    // Update frequency
    if (params.frequency !== undefined) {
      this.setFrequency(params.frequency, params.rampTime || 0);
    }
    
    // Update waveform
    if (params.waveform !== undefined) {
      this.setWaveform(params.waveform);
    }
    
    // Update detune
    if (params.detune !== undefined && this.oscillator) {
      this.oscillator.detune.value = params.detune;
      this.parameters.detune = params.detune;
    }
    
    // Update volume
    if (params.volume !== undefined) {
      this.setVolume(params.volume, params.rampTime || 0);
    }
    
    // Update envelope
    if (params.attack !== undefined || params.decay !== undefined ||
        params.sustain !== undefined || params.release !== undefined) {
      this.setEnvelope({
        attack: params.attack,
        decay: params.decay,
        sustain: params.sustain,
        release: params.release
      });
    }
    
    // Update frequency modulation
    if (params.frequencyModulation !== undefined || params.modulationRatio !== undefined) {
      this.setFrequencyModulation({
        depth: params.frequencyModulation,
        ratio: params.modulationRatio || 2
      });
    }
    
    // Update pulse width
    if (params.pulseWidth !== undefined && this.oscillator?.width) {
      this.oscillator.width.value = params.pulseWidth;
      this.parameters.pulseWidth = params.pulseWidth;
    }
  }
  
  /**
   * Get the current oscillator state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      initialized: this.initialized,
      isPlaying: this.isPlaying,
      parameters: { ...this.parameters }
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    try {
      if (this.isPlaying) {
        this.stop();
      }
      
      // Dispose of Tone.js objects
      if (this.oscillator) this.oscillator.dispose();
      if (this.modulationOsc) this.modulationOsc.dispose();
      if (this.modulationDepth) this.modulationDepth.dispose();
      if (this.envelope) this.envelope.dispose();
      if (this.gain) this.gain.dispose();
      
      this.initialized = false;
      this.isPlaying = false;
      
      console.log('Oscillator disposed');
    } catch (error) {
      console.error('Error disposing Oscillator:', error);
    }
  }
}

export default Oscillator;