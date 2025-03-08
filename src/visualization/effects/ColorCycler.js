/**
 * ColorCycler.js
 * 
 * Handles dynamic color cycling for fractal visualizations.
 * Creates smooth transitions between colors based on time or audio input.
 */

export class ColorCycler {
    /**
     * Initialize the ColorCycler
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.config = options.config || {};
      
      // Default parameters
      this.speed = this.config.speed || 0.1;
      this.audioReactive = this.config.audioReactive || false;
      this.range = this.config.range || 1.0;
      this.offset = this.config.offset || 0.0;
      
      // Current value
      this.value = 0.0;
      
      // Last update timestamp
      this.lastUpdateTime = performance.now();
    }
    
    /**
     * Update color cycle value
     * @param {Object} audioData - Optional audio analysis data
     * @returns {number} - Current color shift value
     */
    update(audioData = null) {
      const now = performance.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = now;
      
      // Base cycle calculation
      let increment = this.speed * deltaTime;
      
      // Apply audio reactivity if enabled and data provided
      if (this.audioReactive && audioData) {
        // Use bass for speed modulation
        if (audioData.bass !== undefined) {
          increment *= 1.0 + (audioData.bass * 2.0);
        }
        
        // Use mid frequencies for direction changes
        if (audioData.mid !== undefined && audioData.mid > 0.8) {
          increment *= -1;
        }
      }
      
      // Update value and keep within [0, range]
      this.value = (this.value + increment) % this.range;
      
      // Apply offset
      return this.value + this.offset;
    }
    
    /**
     * Reset the color cycler
     * @param {number} value - Initial value
     */
    reset(value = 0.0) {
      this.value = value;
      this.lastUpdateTime = performance.now();
    }
    
    /**
     * Configure the color cycler
     * @param {Object} config - Configuration parameters
     */
    configure(config = {}) {
      if (config.speed !== undefined) this.speed = config.speed;
      if (config.audioReactive !== undefined) this.audioReactive = config.audioReactive;
      if (config.range !== undefined) this.range = config.range;
      if (config.offset !== undefined) this.offset = config.offset;
    }
  }
  
  export default ColorCycler;