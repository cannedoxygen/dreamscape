/**
 * BeatDetector.js
 * 
 * Detects rhythmic patterns and beats in audio data.
 * Used for synchronizing visual effects with music.
 */

export class BeatDetector {
    /**
     * Initialize the BeatDetector
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.context = options.context;
      this.analyzer = options.analyzer;
      this.config = options.config || {};
      
      // Beat detection parameters
      this.sensitivity = this.config.sensitivity || 1.5;     // Beat detection sensitivity
      this.minThreshold = this.config.minThreshold || 0.15;  // Minimum threshold for beat detection
      this.decayRate = this.config.decayRate || 0.05;        // How fast the threshold decays
      this.waitTime = this.config.waitTime || 100;           // Minimum ms between beats
      
      // Energy history
      this.energyHistory = new Float32Array(this.config.historySize || 43); // ~1 second at 24 fps
      this.currentIndex = 0;
      
      // Beat detection state
      this.threshold = this.minThreshold;
      this.lastBeatTime = 0;
      
      // Tempo detection state
      this.beatTimes = [];
      this.bpm = 0;
      
      // Results
      this.results = {
        isBeat: false,
        energy: 0,
        bpm: 0,
        confidence: 0
      };
    }
    
    /**
     * Initialize the beat detector
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize() {
      // Initialize energy history to avoid false positives at start
      this.energyHistory.fill(this.minThreshold);
      
      console.log('BeatDetector initialized');
      return Promise.resolve();
    }
    
    /**
     * Detect beats in frequency data
     * @param {Uint8Array} frequencyData - FFT frequency data (0-255 values)
     * @returns {Object} - Beat detection results
     */
    detect(frequencyData) {
      if (!frequencyData || frequencyData.length === 0) {
        return this.results;
      }
      
      // Calculate audio energy
      const energy = this.calculateEnergy(frequencyData);
      
      // Add current energy to history
      this.energyHistory[this.currentIndex] = energy;
      this.currentIndex = (this.currentIndex + 1) % this.energyHistory.length;
      
      // Calculate local average energy (excluding current sample)
      const localAverage = this.calculateLocalAverage();
      
      // Update threshold with local average
      this.threshold = Math.max(
        this.minThreshold,
        localAverage * this.sensitivity
      );
      
      // Detect beat
      const now = performance.now();
      const timeSinceLastBeat = now - this.lastBeatTime;
      const isBeat = energy > this.threshold && timeSinceLastBeat > this.waitTime;
      
      // Update beat state
      if (isBeat) {
        this.lastBeatTime = now;
        this.beatTimes.push(now);
        
        // Keep only recent beats for BPM calculation
        while (this.beatTimes.length > 0 && now - this.beatTimes[0] > 5000) {
          this.beatTimes.shift();
        }
        
        // Calculate BPM if we have enough beats
        if (this.beatTimes.length >= 4) {
          this.calculateBPM();
        }
      }
      
      // Update results
      this.results = {
        isBeat,
        energy,
        threshold: this.threshold,
        bpm: this.bpm,
        confidence: this.calculateConfidence()
      };
      
      return this.results;
    }
    
    /**
     * Calculate energy in the frequency data
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @returns {number} - Energy level (0-1)
     */
    calculateEnergy(frequencyData) {
      // Focus on bass and low-mid frequencies for beat detection
      const startBin = Math.floor(frequencyData.length * 0.05); // Skip very low frequencies
      const endBin = Math.floor(frequencyData.length * 0.5);    // Use lower half of spectrum
      
      let sum = 0;
      for (let i = startBin; i < endBin; i++) {
        // Square the value to get energy
        sum += frequencyData[i] * frequencyData[i];
      }
      
      // Normalize to 0-1
      return Math.sqrt(sum / (endBin - startBin)) / 255;
    }
    
    /**
     * Calculate local average energy
     * @returns {number} - Average energy
     */
    calculateLocalAverage() {
      let sum = 0;
      for (let i = 0; i < this.energyHistory.length; i++) {
        sum += this.energyHistory[i];
      }
      return sum / this.energyHistory.length;
    }
    
    /**
     * Calculate beats per minute (BPM)
     */
    calculateBPM() {
      if (this.beatTimes.length < 2) return;
      
      // Calculate time differences between beats
      const intervals = [];
      for (let i = 1; i < this.beatTimes.length; i++) {
        intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
      }
      
      // Group similar intervals to find the dominant one
      const intervalGroups = this.groupSimilarIntervals(intervals);
      
      // Find the most common interval
      let maxCount = 0;
      let dominantInterval = 0;
      
      for (const [interval, count] of Object.entries(intervalGroups)) {
        if (count > maxCount) {
          maxCount = count;
          dominantInterval = parseFloat(interval);
        }
      }
      
      // Calculate BPM (ms to beats per minute)
      if (dominantInterval > 0) {
        const newBPM = Math.round(60000 / dominantInterval);
        
        // Only update if the BPM is in a reasonable range (40-220 BPM)
        if (newBPM >= 40 && newBPM <= 220) {
          // Smoothly update BPM to avoid jumps
          if (this.bpm === 0) {
            this.bpm = newBPM;
          } else {
            this.bpm = Math.round(this.bpm * 0.8 + newBPM * 0.2);
          }
        }
      }
    }
    
    /**
     * Group similar intervals together
     * @param {Array} intervals - Beat intervals in ms
     * @returns {Object} - Groups of intervals with counts
     */
    groupSimilarIntervals(intervals) {
      const groups = {};
      const tolerance = 0.1; // 10% tolerance for grouping
      
      intervals.forEach(interval => {
        let matched = false;
        
        // Try to find an existing group
        for (const [groupInterval, count] of Object.entries(groups)) {
          const groupValue = parseFloat(groupInterval);
          const ratio = interval / groupValue;
          
          // Check if interval is within tolerance
          if (ratio > (1 - tolerance) && ratio < (1 + tolerance)) {
            // Weighted average to update the group
            const newValue = (groupValue * count + interval) / (count + 1);
            delete groups[groupInterval];
            groups[newValue] = count + 1;
            matched = true;
            break;
          }
        }
        
        // If no matching group, create a new one
        if (!matched) {
          groups[interval] = 1;
        }
      });
      
      return groups;
    }
    
    /**
     * Calculate confidence level in the detected BPM
     * @returns {number} - Confidence level (0-1)
     */
    calculateConfidence() {
      if (this.beatTimes.length < 4 || this.bpm === 0) return 0;
      
      // More beats = higher confidence, up to a point
      const beatCount = Math.min(this.beatTimes.length, 16) / 16;
      
      // Calculate regularity of beats
      const intervals = [];
      for (let i = 1; i < this.beatTimes.length; i++) {
        intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
      }
      
      const expectedInterval = 60000 / this.bpm;
      let variance = 0;
      
      intervals.forEach(interval => {
        const deviation = Math.abs(interval - expectedInterval) / expectedInterval;
        variance += deviation;
      });
      
      variance /= intervals.length;
      const regularity = Math.max(0, 1 - variance);
      
      // Combine factors for overall confidence
      return beatCount * regularity;
    }
    
    /**
     * Configure the beat detector
     * @param {Object} config - Configuration options
     */
    configure(config = {}) {
      if (config.sensitivity !== undefined) this.sensitivity = config.sensitivity;
      if (config.minThreshold !== undefined) this.minThreshold = config.minThreshold;
      if (config.decayRate !== undefined) this.decayRate = config.decayRate;
      if (config.waitTime !== undefined) this.waitTime = config.waitTime;
      
      // Reset energy history if size changed
      if (config.historySize !== undefined && config.historySize !== this.energyHistory.length) {
        this.energyHistory = new Float32Array(config.historySize);
        this.energyHistory.fill(this.minThreshold);
        this.currentIndex = 0;
      }
    }
    
    /**
     * Reset the beat detector
     */
    reset() {
      this.energyHistory.fill(this.minThreshold);
      this.currentIndex = 0;
      this.threshold = this.minThreshold;
      this.lastBeatTime = 0;
      this.beatTimes = [];
      this.bpm = 0;
      
      this.results = {
        isBeat: false,
        energy: 0,
        bpm: 0,
        confidence: 0
      };
    }
    
    /**
     * Get the current beat detection results
     * @returns {Object} - Beat detection results
     */
    getResults() {
      return { ...this.results };
    }
  }
  
  export default BeatDetector;