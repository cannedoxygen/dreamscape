/**
 * FrequencyAnalyzer.js
 * 
 * Analyzes audio frequency data and extracts useful information like
 * volume levels, frequency bands, and spectral characteristics.
 */

export class FrequencyAnalyzer {
    /**
     * Initialize the FrequencyAnalyzer
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.context = options.context;
      this.analyzer = options.analyzer;
      this.config = options.config || {};
      
      // Default frequency ranges (in Hz)
      this.frequencyRanges = this.config.frequencyRanges || {
        bass: [20, 250],
        lowMid: [250, 500],
        mid: [500, 2000],
        highMid: [2000, 4000],
        treble: [4000, 20000]
      };
      
      // Smoothing factors for values (0-1)
      this.smoothing = this.config.smoothing || {
        volume: 0.8,
        bass: 0.8,
        lowMid: 0.7,
        mid: 0.7,
        highMid: 0.6,
        treble: 0.6,
        peaks: 0.5
      };
      
      // Current analysis results
      this.results = {
        volume: 0,
        bass: 0,
        lowMid: 0,
        mid: 0,
        highMid: 0,
        treble: 0,
        peaks: []
      };
      
      // Previous values for smoothing
      this.previousValues = { ...this.results };
    }
    
    /**
     * Initialize the analyzer
     * @returns {Promise} - Resolves when initialization is complete
     */
    async initialize() {
      // Not much to initialize since we're using the provided analyzer
      console.log('FrequencyAnalyzer initialized');
      return Promise.resolve();
    }
    
    /**
     * Analyze frequency data
     * @param {Uint8Array} frequencyData - FFT frequency data (0-255 values)
     * @returns {Object} - Analysis results
     */
    analyze(frequencyData) {
      if (!frequencyData || frequencyData.length === 0) {
        return this.results;
      }
      
      // Calculate average volume from all frequency bins
      const rawVolume = this.calculateAverageVolume(frequencyData);
      
      // Calculate energy in different frequency bands
      const rawBass = this.calculateBandEnergy(frequencyData, this.frequencyRanges.bass);
      const rawLowMid = this.calculateBandEnergy(frequencyData, this.frequencyRanges.lowMid);
      const rawMid = this.calculateBandEnergy(frequencyData, this.frequencyRanges.mid);
      const rawHighMid = this.calculateBandEnergy(frequencyData, this.frequencyRanges.highMid);
      const rawTreble = this.calculateBandEnergy(frequencyData, this.frequencyRanges.treble);
      
      // Detect peaks in the spectrum
      const rawPeaks = this.detectPeaks(frequencyData);
      
      // Apply smoothing to all values
      this.results.volume = this.smooth(rawVolume, this.previousValues.volume, this.smoothing.volume);
      this.results.bass = this.smooth(rawBass, this.previousValues.bass, this.smoothing.bass);
      this.results.lowMid = this.smooth(rawLowMid, this.previousValues.lowMid, this.smoothing.lowMid);
      this.results.mid = this.smooth(rawMid, this.previousValues.mid, this.smoothing.mid);
      this.results.highMid = this.smooth(rawHighMid, this.previousValues.highMid, this.smoothing.highMid);
      this.results.treble = this.smooth(rawTreble, this.previousValues.treble, this.smoothing.treble);
      
      // Smooth each peak
      this.results.peaks = rawPeaks.map((peak, i) => {
        const prevPeak = this.previousValues.peaks[i] || peak;
        return {
          frequency: peak.frequency,
          magnitude: this.smooth(peak.magnitude, prevPeak.magnitude, this.smoothing.peaks)
        };
      });
      
      // Store current values for next smoothing
      this.previousValues = {
        volume: this.results.volume,
        bass: this.results.bass,
        lowMid: this.results.lowMid,
        mid: this.results.mid,
        highMid: this.results.highMid,
        treble: this.results.treble,
        peaks: [...this.results.peaks]
      };
      
      return this.results;
    }
    
    /**
     * Calculate the average volume from frequency data
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @returns {number} - Average volume (0-1)
     */
    calculateAverageVolume(frequencyData) {
      let sum = 0;
      
      // Sum all frequency bin values
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      
      // Calculate average and normalize to 0-1
      return sum / (frequencyData.length * 255);
    }
    
    /**
     * Calculate energy in a frequency band
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @param {Array} range - Frequency range [min, max] in Hz
     * @returns {number} - Band energy (0-1)
     */
    calculateBandEnergy(frequencyData, range) {
      if (!this.analyzer) return 0;
      
      // Get analyzer properties
      const sampleRate = this.context?.sampleRate || 44100;
      const binCount = frequencyData.length;
      
      // Calculate bin indices for the frequency range
      const minBin = Math.floor(range[0] * binCount / (sampleRate / 2));
      const maxBin = Math.ceil(range[1] * binCount / (sampleRate / 2));
      
      // Clamp bin indices to valid range
      const startBin = Math.max(0, minBin);
      const endBin = Math.min(binCount - 1, maxBin);
      
      if (startBin >= endBin) return 0;
      
      let sum = 0;
      let count = 0;
      
      // Sum energy in the frequency band
      for (let i = startBin; i <= endBin; i++) {
        // Square the value to get energy
        sum += frequencyData[i] * frequencyData[i];
        count++;
      }
      
      // Return normalized average energy
      return Math.sqrt(sum / count) / 255;
    }
    
    /**
     * Detect peaks in the frequency spectrum
     * @param {Uint8Array} frequencyData - FFT frequency data
     * @returns {Array} - Array of peak objects {frequency, magnitude}
     */
    detectPeaks(frequencyData) {
      const peaks = [];
      const minPeakHeight = 100; // Minimum peak height (0-255)
      const minPeakDistance = 5; // Minimum distance between peaks in bins
      
      // Skip the first few bins (often contain DC offset and very low frequencies)
      const startBin = 3;
      const endBin = frequencyData.length - 1;
      
      for (let i = startBin; i < endBin; i++) {
        const value = frequencyData[i];
        
        // Check if this bin is a local maximum
        if (value > minPeakHeight &&
            value > frequencyData[i - 1] &&
            value > frequencyData[i + 1]) {
          
          // Ensure it's a significant peak by checking a wider range
          if (value > frequencyData[i - 2] && value > frequencyData[i + 2]) {
            // Calculate peak frequency
            const frequency = this.binToFrequency(i);
            
            // Check if it's far enough from previously detected peaks
            if (!peaks.some(peak => 
              Math.abs(this.frequencyToBin(peak.frequency) - i) < minPeakDistance)) {
              
              peaks.push({
                frequency,
                magnitude: value / 255
              });
            }
          }
        }
      }
      
      // Sort peaks by magnitude (strongest first)
      peaks.sort((a, b) => b.magnitude - a.magnitude);
      
      // Return top N peaks
      return peaks.slice(0, 5);
    }
    
    /**
     * Convert frequency bin to frequency in Hz
     * @param {number} bin - Frequency bin index
     * @returns {number} - Frequency in Hz
     */
    binToFrequency(bin) {
      if (!this.analyzer) return 0;
      
      const sampleRate = this.context?.sampleRate || 44100;
      const binCount = this.analyzer.frequencyBinCount || 1024;
      
      return bin * sampleRate / (binCount * 2);
    }
    
    /**
     * Convert frequency in Hz to bin index
     * @param {number} frequency - Frequency in Hz
     * @returns {number} - Bin index
     */
    frequencyToBin(frequency) {
      if (!this.analyzer) return 0;
      
      const sampleRate = this.context?.sampleRate || 44100;
      const binCount = this.analyzer.frequencyBinCount || 1024;
      
      return Math.round(frequency * binCount * 2 / sampleRate);
    }
    
    /**
     * Apply smoothing to a value
     * @param {number} current - Current value
     * @param {number} previous - Previous value
     * @param {number} factor - Smoothing factor (0-1)
     * @returns {number} - Smoothed value
     */
    smooth(current, previous, factor) {
      return previous * factor + current * (1 - factor);
    }
    
    /**
     * Configure the analyzer
     * @param {Object} config - Configuration options
     */
    configure(config = {}) {
      // Update frequency ranges
      if (config.frequencyRanges) {
        this.frequencyRanges = {
          ...this.frequencyRanges,
          ...config.frequencyRanges
        };
      }
      
      // Update smoothing factors
      if (config.smoothing) {
        this.smoothing = {
          ...this.smoothing,
          ...config.smoothing
        };
      }
    }
    
    /**
     * Get the current analysis results
     * @returns {Object} - Analysis results
     */
    getResults() {
      return { ...this.results };
    }
    
    /**
     * Clean up resources
     */
    dispose() {
      // No resources to dispose of, we don't own the analyzer
    }
  }
  
  export default FrequencyAnalyzer;