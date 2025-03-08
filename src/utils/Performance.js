/**
 * Performance.js
 * 
 * Utility for monitoring performance metrics throughout the application.
 * Provides methods for marking, measuring, and tracking performance.
 * Uses the Performance API when available, with fallbacks for unsupported browsers.
 */

// Performance monitoring enabled flag
let PERFORMANCE_MONITORING_ENABLED = true;

// Store for performance marks and measurements
const performanceStore = {
  marks: new Map(),
  measures: new Map(),
  counters: new Map(),
  activeStartMarks: new Map(),
  metrics: {
    fps: 0,
    frameTime: 0,
    cpuTime: 0,
    gpuTime: 0,
    memoryUsage: 0
  },
  frameTimeHistory: [], // Store recent frame times for smoothing
  historyLength: 60,    // Keep track of last 60 frames (1 second at 60fps)
  lastFrameTime: 0,
  frameCount: 0
};

// Check if Performance API is available
const hasPerformanceAPI = typeof performance !== 'undefined' && 
  typeof performance.now === 'function' &&
  typeof performance.mark === 'function' &&
  typeof performance.measure === 'function';

/**
 * Performance utility for monitoring and measuring application performance
 */
export class Performance {
  /**
   * Initialize the performance monitor
   * @param {Object} options - Configuration options
   */
  static initialize(options = {}) {
    // Apply options
    PERFORMANCE_MONITORING_ENABLED = options.enabled !== undefined ? options.enabled : true;
    performanceStore.historyLength = options.historyLength || 60;
    
    // Clear existing performance data
    this.clear();
    
    // Start measuring frames if enabled
    if (PERFORMANCE_MONITORING_ENABLED) {
      this.startFrameMonitoring();
    }
    
    console.log(`Performance monitoring ${PERFORMANCE_MONITORING_ENABLED ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Enable or disable performance monitoring
   * @param {boolean} enabled - Whether monitoring is enabled
   */
  static setEnabled(enabled) {
    PERFORMANCE_MONITORING_ENABLED = enabled;
    
    if (enabled && !this.isFrameMonitoringActive) {
      this.startFrameMonitoring();
    }
  }
  
  /**
   * Check if performance monitoring is enabled
   * @returns {boolean} - True if monitoring is enabled
   */
  static isEnabled() {
    return PERFORMANCE_MONITORING_ENABLED;
  }
  
  /**
   * Clear all performance data
   */
  static clear() {
    performanceStore.marks.clear();
    performanceStore.measures.clear();
    performanceStore.counters.clear();
    performanceStore.activeStartMarks.clear();
    performanceStore.frameTimeHistory = [];
    performanceStore.frameCount = 0;
    
    // Clear native performance entries if available
    if (hasPerformanceAPI && typeof performance.clearMarks === 'function') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
  
  /**
   * Create a performance mark
   * @param {string} name - Mark name
   */
  static mark(name) {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    const time = hasPerformanceAPI ? performance.now() : Date.now();
    
    // Store mark in our internal store
    performanceStore.marks.set(name, time);
    
    // Use native performance API if available
    if (hasPerformanceAPI) {
      try {
        performance.mark(name);
      } catch (e) {
        console.warn(`Failed to create performance mark: ${name}`, e);
      }
    }
  }
  
  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number|null} - Duration in ms or null if marks don't exist
   */
  static measure(name, startMark, endMark) {
    if (!PERFORMANCE_MONITORING_ENABLED) return null;
    
    let duration = null;
    let startTime, endTime;
    
    // Get mark times from our store
    if (performanceStore.marks.has(startMark) && performanceStore.marks.has(endMark)) {
      startTime = performanceStore.marks.get(startMark);
      endTime = performanceStore.marks.get(endMark);
      duration = endTime - startTime;
    }
    
    // Use native performance API if available
    if (hasPerformanceAPI) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          duration = entries[entries.length - 1].duration;
        }
      } catch (e) {
        // Fallback to manual calculation if native API fails
        if (duration === null && performanceStore.marks.has(startMark) && performanceStore.marks.has(endMark)) {
          duration = performanceStore.marks.get(endMark) - performanceStore.marks.get(startMark);
        }
      }
    }
    
    // Store the measurement
    if (duration !== null) {
      performanceStore.measures.set(name, duration);
    }
    
    return duration;
  }
  
  /**
   * Start measuring a section of code
   * @param {string} name - Section name
   */
  static startMeasure(name) {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    const startMarkName = `${name}-start`;
    this.mark(startMarkName);
    performanceStore.activeStartMarks.set(name, startMarkName);
  }
  
  /**
   * End measuring a section of code
   * @param {string} name - Section name
   * @returns {number|null} - Duration in ms or null if section not found
   */
  static endMeasure(name) {
    if (!PERFORMANCE_MONITORING_ENABLED) return null;
    
    if (!performanceStore.activeStartMarks.has(name)) {
      console.warn(`No active measurement found for: ${name}`);
      return null;
    }
    
    const startMarkName = performanceStore.activeStartMarks.get(name);
    const endMarkName = `${name}-end`;
    
    this.mark(endMarkName);
    const duration = this.measure(name, startMarkName, endMarkName);
    
    performanceStore.activeStartMarks.delete(name);
    return duration;
  }
  
  /**
   * Get the duration of a specific measure
   * @param {string} name - Measure name
   * @returns {number|null} - Duration in ms or null if measure not found
   */
  static getMeasure(name) {
    return performanceStore.measures.get(name) || null;
  }
  
  /**
   * Get the most recent measure with the given name
   * @param {string} name - Measure name
   * @returns {Object|null} - Measure data or null if not found
   */
  static getLastMeasure(name) {
    const duration = performanceStore.measures.get(name);
    
    if (duration === undefined) return null;
    
    return {
      name,
      duration,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get all measures
   * @returns {Object} - Object with measure names as keys and durations as values
   */
  static getAllMeasures() {
    return Object.fromEntries(performanceStore.measures);
  }
  
  /**
   * Increment a counter
   * @param {string} name - Counter name
   * @param {number} value - Value to increment by (default: 1)
   */
  static incrementCounter(name, value = 1) {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    const currentValue = performanceStore.counters.get(name) || 0;
    performanceStore.counters.set(name, currentValue + value);
  }
  
  /**
   * Get the value of a counter
   * @param {string} name - Counter name
   * @returns {number} - Counter value or 0 if counter not found
   */
  static getCounter(name) {
    return performanceStore.counters.get(name) || 0;
  }
  
  /**
   * Reset a counter to 0
   * @param {string} name - Counter name
   */
  static resetCounter(name) {
    performanceStore.counters.set(name, 0);
  }
  
  /**
   * Start monitoring frame rate
   */
  static startFrameMonitoring() {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    this.isFrameMonitoringActive = true;
    this.frameMonitoringStartTime = hasPerformanceAPI ? performance.now() : Date.now();
    this.lastFrameTime = this.frameMonitoringStartTime;
    
    const frameCallback = () => {
      if (!this.isFrameMonitoringActive) return;
      
      const now = hasPerformanceAPI ? performance.now() : Date.now();
      const frameTime = now - this.lastFrameTime;
      this.lastFrameTime = now;
      
      // Track frame time
      performanceStore.frameTimeHistory.push(frameTime);
      if (performanceStore.frameTimeHistory.length > performanceStore.historyLength) {
        performanceStore.frameTimeHistory.shift();
      }
      
      // Calculate average frame time and FPS
      const avgFrameTime = performanceStore.frameTimeHistory.reduce((sum, time) => sum + time, 0) / 
                           performanceStore.frameTimeHistory.length;
      
      performanceStore.metrics.frameTime = avgFrameTime;
      performanceStore.metrics.fps = 1000 / avgFrameTime;
      
      // Increment frame counter
      performanceStore.frameCount++;
      
      // Check memory usage if available
      if (window.performance && window.performance.memory) {
        performanceStore.metrics.memoryUsage = window.performance.memory.usedJSHeapSize / 
                                               window.performance.memory.jsHeapSizeLimit;
      }
      
      // Continue monitoring
      requestAnimationFrame(frameCallback);
    };
    
    // Start the monitoring loop
    requestAnimationFrame(frameCallback);
  }
  
  /**
   * Stop monitoring frame rate
   */
  static stopFrameMonitoring() {
    this.isFrameMonitoringActive = false;
  }
  
  /**
   * Get the current FPS (frames per second)
   * @returns {number} - Current FPS
   */
  static getFPS() {
    return performanceStore.metrics.fps;
  }
  
  /**
   * Get the current frame time in milliseconds
   * @returns {number} - Current frame time in ms
   */
  static getFrameTime() {
    return performanceStore.metrics.frameTime;
  }
  
  /**
   * Get all performance metrics
   * @returns {Object} - Performance metrics
   */
  static getMetrics() {
    return { ...performanceStore.metrics };
  }
  
  /**
   * Log performance metrics to console
   * @param {Array} metrics - Names of metrics to log (or all if not specified)
   */
  static logMetrics(metrics) {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    console.group('Performance Metrics');
    
    if (!metrics || metrics.length === 0) {
      // Log all metrics
      console.log('FPS:', performanceStore.metrics.fps.toFixed(1));
      console.log('Frame Time:', performanceStore.metrics.frameTime.toFixed(2), 'ms');
      console.log('Total Frames:', performanceStore.frameCount);
      
      // Log all measures
      if (performanceStore.measures.size > 0) {
        console.group('Measures');
        performanceStore.measures.forEach((duration, name) => {
          console.log(`${name}:`, duration.toFixed(2), 'ms');
        });
        console.groupEnd();
      }
      
      // Log all counters
      if (performanceStore.counters.size > 0) {
        console.group('Counters');
        performanceStore.counters.forEach((value, name) => {
          console.log(`${name}:`, value);
        });
        console.groupEnd();
      }
    } else {
      // Log only specified metrics
      metrics.forEach(name => {
        if (name === 'fps') {
          console.log('FPS:', performanceStore.metrics.fps.toFixed(1));
        } else if (name === 'frameTime') {
          console.log('Frame Time:', performanceStore.metrics.frameTime.toFixed(2), 'ms');
        } else if (name === 'frames') {
          console.log('Total Frames:', performanceStore.frameCount);
        } else if (performanceStore.measures.has(name)) {
          console.log(`${name}:`, performanceStore.measures.get(name).toFixed(2), 'ms');
        } else if (performanceStore.counters.has(name)) {
          console.log(`${name}:`, performanceStore.counters.get(name));
        }
      });
    }
    
    console.groupEnd();
  }
  
  /**
   * Create a performance report
   * @returns {Object} - Performance report
   */
  static createReport() {
    return {
      timestamp: Date.now(),
      metrics: { ...performanceStore.metrics },
      measures: Object.fromEntries(performanceStore.measures),
      counters: Object.fromEntries(performanceStore.counters),
      frameCount: performanceStore.frameCount,
      monitoringEnabled: PERFORMANCE_MONITORING_ENABLED
    };
  }
  
  /**
   * Add a custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  static setCustomMetric(name, value) {
    if (!PERFORMANCE_MONITORING_ENABLED) return;
    
    performanceStore.metrics[name] = value;
  }
  
  /**
   * Get a custom metric
   * @param {string} name - Metric name
   * @returns {number|null} - Metric value or null if not found
   */
  static getCustomMetric(name) {
    return performanceStore.metrics[name] || null;
  }
}

export default Performance;