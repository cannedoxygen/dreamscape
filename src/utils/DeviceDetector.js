/**
 * DeviceDetector.js
 * 
 * Utility for detecting device capabilities, browser features,
 * and system performance to optimize the application experience.
 */

/**
 * Device detection results
 */
let detectionResults = null;

/**
 * DeviceDetector class
 */
export class DeviceDetector {
  /**
   * Detect device capabilities
   * @param {Object} options - Detection options
   * @returns {Object} - Device capabilities
   */
  static detect(options = {}) {
    // If we already ran detection and caching is not disabled, return cached results
    if (detectionResults && !options.forceRedetect) {
      return detectionResults;
    }
    
    console.log('Detecting device capabilities...');
    
    // Initialize results object
    const results = {
      browser: {
        name: '',
        version: '',
        engine: '',
        supported: true
      },
      
      device: {
        type: 'desktop', // 'desktop', 'tablet', 'mobile'
        orientation: 'landscape',
        pixelRatio: 1,
        touchCapable: false,
        pointerType: 'mouse'
      },
      
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        size: 'medium', // 'small', 'medium', 'large'
        aspectRatio: 0
      },
      
      system: {
        os: '',
        osVersion: '',
        ram: 'unknown',
        language: navigator.language || 'en-US',
        prefersReducedMotion: false,
        prefersDarkMode: false
      },
      
      gpu: {
        vendor: 'unknown',
        renderer: 'unknown',
        tier: 'mid', // 'low', 'mid', 'high'
        antialiasing: true,
        webglVersion: 1
      },
      
      capabilities: {
        webgl: false,
        webgl2: false,
        webgpu: false,
        canvas2d: false,
        webAudio: false,
        webWorkers: false,
        localStorage: false,
        sessionStorage: false,
        webAssembly: false,
        sharedArrayBuffer: false,
        offscreenCanvas: false,
        performance: false,
        geolocation: false,
        bluetooth: false,
        batteryApi: false
      },
      
      connection: {
        type: 'unknown',
        downlinkSpeed: 0,
        saveData: false
      },
      
      performance: {
        category: 'medium', // 'low', 'medium', 'high'
        benchmark: 0
      }
    };
    
    // Detect browser
    this.detectBrowser(results);
    
    // Detect device type
    this.detectDeviceType(results);
    
    // Detect screen properties
    this.detectScreen(results);
    
    // Detect OS
    this.detectOS(results);
    
    // Detect user preferences
    this.detectUserPreferences(results);
    
    // Detect WebGL capabilities
    this.detectWebGL(results);
    
    // Detect features/capabilities
    this.detectCapabilities(results);
    
    // Detect network
    this.detectNetwork(results);
    
    // Run performance test
    if (options.testPerformance !== false) {
      this.benchmarkPerformance(results);
    }
    
    // Cache the results
    detectionResults = results;
    
    console.log('Device detection complete:', results);
    return results;
  }
  
  /**
   * Detect browser and version
   * @param {Object} results - Results object to update
   */
  static detectBrowser(results) {
    const ua = navigator.userAgent;
    
    // Check for Edge first (since it also contains Chrome and Safari)
    if (ua.indexOf("Edg") !== -1) {
      results.browser.name = "Edge";
      results.browser.engine = "Blink";
    }
    // Chrome
    else if (ua.indexOf("Chrome") !== -1) {
      results.browser.name = "Chrome";
      results.browser.engine = "Blink";
    }
    // Firefox
    else if (ua.indexOf("Firefox") !== -1) {
      results.browser.name = "Firefox";
      results.browser.engine = "Gecko";
    }
    // Safari
    else if (ua.indexOf("Safari") !== -1) {
      results.browser.name = "Safari";
      results.browser.engine = "WebKit";
    }
    // IE
    else if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1) {
      results.browser.name = "Internet Explorer";
      results.browser.engine = "Trident";
      results.browser.supported = false; // Mark IE as unsupported
    } else {
      results.browser.name = "Unknown";
      results.browser.engine = "Unknown";
    }
    
    // Extract browser version
    let versionMatch;
    
    switch (results.browser.name) {
      case "Edge":
        versionMatch = ua.match(/Edg\/([\d.]+)/);
        break;
      case "Chrome":
        versionMatch = ua.match(/Chrome\/([\d.]+)/);
        break;
      case "Firefox":
        versionMatch = ua.match(/Firefox\/([\d.]+)/);
        break;
      case "Safari":
        versionMatch = ua.match(/Version\/([\d.]+)/);
        break;
      case "Internet Explorer":
        versionMatch = ua.match(/(?:MSIE |rv:)([\d.]+)/);
        break;
    }
    
    results.browser.version = versionMatch ? versionMatch[1] : "Unknown";
  }
  
  /**
   * Detect device type (desktop, tablet, mobile)
   * @param {Object} results - Results object to update
   */
  static detectDeviceType(results) {
    // Check for touch capability
    results.device.touchCapable = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
    
    // Determine pointer type
    if (window.matchMedia("(pointer: coarse)").matches) {
      results.device.pointerType = 'touch';
    } else if (window.matchMedia("(pointer: fine)").matches) {
      results.device.pointerType = 'mouse';
    } else {
      results.device.pointerType = 'mixed';
    }
    
    // Check device type based on user agent
    const ua = navigator.userAgent;
    
    // Test for mobile or tablet devices
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);
    const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua);
    
    if (isTablet) {
      results.device.type = 'tablet';
    } else if (isMobile) {
      results.device.type = 'mobile';
    } else {
      results.device.type = 'desktop';
    }
    
    // Detect orientation
    if (window.innerWidth > window.innerHeight) {
      results.device.orientation = 'landscape';
    } else {
      results.device.orientation = 'portrait';
    }
    
    // Get device pixel ratio
    results.device.pixelRatio = window.devicePixelRatio || 1;
  }
  
  /**
   * Detect screen properties
   * @param {Object} results - Results object to update
   */
  static detectScreen(results) {
    // Get screen dimensions
    results.screen.width = window.innerWidth;
    results.screen.height = window.innerHeight;
    
    // Calculate aspect ratio
    results.screen.aspectRatio = results.screen.width / results.screen.height;
    
    // Determine screen size category
    const screenArea = results.screen.width * results.screen.height;
    
    if (screenArea < 500000) {
      results.screen.size = 'small';
    } else if (screenArea < 1200000) {
      results.screen.size = 'medium';
    } else {
      results.screen.size = 'large';
    }
  }
  
  /**
   * Detect operating system
   * @param {Object} results - Results object to update
   */
  static detectOS(results) {
    const ua = navigator.userAgent;
    
    // Windows
    if (ua.indexOf("Windows") !== -1) {
      results.system.os = "Windows";
      
      if (ua.indexOf("Windows NT 10.0") !== -1) {
        results.system.osVersion = "10";
      } else if (ua.indexOf("Windows NT 6.3") !== -1) {
        results.system.osVersion = "8.1";
      } else if (ua.indexOf("Windows NT 6.2") !== -1) {
        results.system.osVersion = "8";
      } else if (ua.indexOf("Windows NT 6.1") !== -1) {
        results.system.osVersion = "7";
      } else if (ua.indexOf("Windows NT 6.0") !== -1) {
        results.system.osVersion = "Vista";
      } else if (ua.indexOf("Windows NT 5.1") !== -1) {
        results.system.osVersion = "XP";
      } else {
        results.system.osVersion = "Unknown";
      }
    }
    // macOS
    else if (ua.indexOf("Macintosh") !== -1) {
      results.system.os = "macOS";
      const versionMatch = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
      
      if (versionMatch) {
        results.system.osVersion = versionMatch[1]
          .replace(/_/g, '.')
          .replace(/\.0$/, '');
      } else {
        results.system.osVersion = "Unknown";
      }
    }
    // iOS
    else if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      results.system.os = "iOS";
      const versionMatch = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
      
      if (versionMatch) {
        results.system.osVersion = versionMatch[1]
          .replace(/_/g, '.')
          .replace(/\.0$/, '');
      } else {
        results.system.osVersion = "Unknown";
      }
    }
    // Android
    else if (ua.indexOf("Android") !== -1) {
      results.system.os = "Android";
      const versionMatch = ua.match(/Android (\d+(\.\d+)+)/);
      
      if (versionMatch) {
        results.system.osVersion = versionMatch[1];
      } else {
        results.system.osVersion = "Unknown";
      }
    }
    // Linux
    else if (ua.indexOf("Linux") !== -1) {
      results.system.os = "Linux";
      results.system.osVersion = "Unknown";
    }
    // Other
    else {
      results.system.os = "Unknown";
      results.system.osVersion = "Unknown";
    }
    
    // Try to estimate RAM if supported
    if (navigator.deviceMemory) {
      results.system.ram = navigator.deviceMemory + "GB";
    } else {
      results.system.ram = "unknown";
    }
  }
  
  /**
   * Detect user preferences (dark mode, reduced motion, etc.)
   * @param {Object} results - Results object to update
   */
  static detectUserPreferences(results) {
    // Check if user prefers reduced motion
    if (window.matchMedia) {
      results.system.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      results.system.prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }
  
  /**
   * Detect WebGL capabilities
   * @param {Object} results - Results object to update
   */
  static detectWebGL(results) {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      
      // Try WebGL 2 first
      let gl = canvas.getContext('webgl2');
      
      if (gl) {
        results.capabilities.webgl = true;
        results.capabilities.webgl2 = true;
        results.gpu.webglVersion = 2;
      } else {
        // Fall back to WebGL 1
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          results.capabilities.webgl = true;
          results.capabilities.webgl2 = false;
          results.gpu.webglVersion = 1;
        }
      }
      
      // If we have a GL context, get GPU info
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        
        if (debugInfo) {
          results.gpu.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
          results.gpu.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
        }
        
        // Check for antialiasing support
        results.gpu.antialiasing = gl.getContextAttributes().antialias;
        
        // Determine GPU tier based on renderer string
        const renderer = results.gpu.renderer.toLowerCase();
        
        if (renderer.includes('intel')) {
          // Intel GPUs are typically lower-end for graphics
          results.gpu.tier = 'low';
          
          // Except for newer Iris and Arc GPUs
          if (renderer.includes('iris') || renderer.includes('arc') || renderer.includes('xe')) {
            results.gpu.tier = 'mid';
          }
        } else if (renderer.includes('nvidia')) {
          // NVIDIA GPUs are typically high-end
          results.gpu.tier = 'high';
          
          // Unless it's an older or mobile GPU
          if (renderer.includes('mx') || renderer.match(/gt ?\d{3}/)) {
            results.gpu.tier = 'mid';
          }
        } else if (renderer.includes('amd') || renderer.includes('radeon')) {
          // AMD GPUs vary, but often mid-to-high
          results.gpu.tier = 'mid';
          
          // Higher end AMD GPUs
          if (renderer.includes('vega') || renderer.includes('rx') || renderer.includes('radeon pro')) {
            results.gpu.tier = 'high';
          }
        } else if (renderer.includes('apple')) {
          // Apple GPUs are typically good
          results.gpu.tier = 'mid';
          
          // M1/M2 GPUs are high-end
          if (renderer.includes('m1') || renderer.includes('m2')) {
            results.gpu.tier = 'high';
          }
        } else if (
          renderer.includes('mali') || 
          renderer.includes('adreno') || 
          renderer.includes('powervr')
        ) {
          // Mobile GPUs are typically lower-end
          results.gpu.tier = 'low';
          
          // Newer or higher-end mobile GPUs
          if (
            renderer.match(/mali-g\d{2}/) || 
            renderer.match(/adreno \(tm\) 6\d{2}/) ||
            renderer.match(/adreno \(tm\) 7\d{2}/)
          ) {
            results.gpu.tier = 'mid';
          }
        }
        
        // Check WebGPU support if available
        if (navigator.gpu) {
          results.capabilities.webgpu = true;
        }
      }
    } catch (error) {
      console.warn('WebGL detection failed:', error);
      results.gpu.tier = 'low'; // Assume worst-case scenario
    }
  }
  
  /**
   * Detect browser capabilities
   * @param {Object} results - Results object to update
   */
  static detectCapabilities(results) {
    // Canvas 2D support
    try {
      const canvas = document.createElement('canvas');
      results.capabilities.canvas2d = !!canvas.getContext('2d');
    } catch (e) {
      results.capabilities.canvas2d = false;
    }
    
    // Web Audio support
    results.capabilities.webAudio = typeof AudioContext !== 'undefined' || 
                                    typeof webkitAudioContext !== 'undefined';
    
    // Web Workers support
    results.capabilities.webWorkers = typeof Worker !== 'undefined';
    
    // LocalStorage support
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.capabilities.localStorage = true;
    } catch (e) {
      results.capabilities.localStorage = false;
    }
    
    // SessionStorage support
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      results.capabilities.sessionStorage = true;
    } catch (e) {
      results.capabilities.sessionStorage = false;
    }
    
    // WebAssembly support
    results.capabilities.webAssembly = typeof WebAssembly !== 'undefined';
    
    // SharedArrayBuffer support (needed for certain parallel operations)
    try {
      results.capabilities.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    } catch (e) {
      results.capabilities.sharedArrayBuffer = false;
    }
    
    // OffscreenCanvas support
    results.capabilities.offscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    
    // Performance API
    results.capabilities.performance = typeof performance !== 'undefined' && 
                                        typeof performance.now === 'function';
    
    // Geolocation
    results.capabilities.geolocation = navigator && 'geolocation' in navigator;
    
    // Web Bluetooth API
    results.capabilities.bluetooth = navigator && 'bluetooth' in navigator;
    
    // Battery API
    results.capabilities.batteryApi = navigator && 'getBattery' in navigator;
  }
  
  /**
   * Detect network connection information
   * @param {Object} results - Results object to update
   */
  static detectNetwork(results) {
    if (navigator.connection) {
      results.connection.type = navigator.connection.effectiveType || 'unknown';
      results.connection.downlinkSpeed = navigator.connection.downlink || 0;
      results.connection.saveData = navigator.connection.saveData || false;
    }
  }
  
  /**
   * Run a quick benchmark to assess device performance
   * @param {Object} results - Results object to update
   */
  static benchmarkPerformance(results) {
    // Start timer
    const startTime = performance.now();
    
    // Simple computational benchmark (prime number calculation)
    let primeCount = 0;
    const isPrime = (num) => {
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
      }
      return num > 1;
    };
    
    // Count primes up to 10000
    for (let i = 1; i < 10000; i++) {
      if (isPrime(i)) primeCount++;
    }
    
    // Calculate time taken
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Normalize benchmark score (lower is better)
    results.performance.benchmark = duration;
    
    // Categorize performance
    if (duration < 50) {
      results.performance.category = 'high';
    } else if (duration < 150) {
      results.performance.category = 'medium';
    } else {
      results.performance.category = 'low';
    }
    
    // Adjust GPU tier based on performance if it's ambiguous
    if (results.gpu.tier === 'mid' && results.performance.category === 'low') {
      results.gpu.tier = 'low';
    } else if (results.gpu.tier === 'mid' && results.performance.category === 'high') {
      results.gpu.tier = 'high';
    }
  }
  
  /**
   * Get a simplified capability assessment for quick decisions
   * @returns {Object} - Simplified device capabilities
   */
  static getSimplifiedCapabilities() {
    // Run detection if not already done
    const results = this.detect();
    
    // Simplified capabilities object
    return {
      gpu: results.gpu.tier, // 'low', 'mid', 'high'
      mobile: results.device.type !== 'desktop',
      touchDevice: results.device.touchCapable,
      screenSize: results.screen.size, // 'small', 'medium', 'large'
      webgl2: results.capabilities.webgl2,
      highDPI: results.device.pixelRatio > 1,
      performance: results.performance.category, // 'low', 'medium', 'high'
      supportsWebAudio: results.capabilities.webAudio,
      batteryOptimization: results.system.prefersReducedMotion || 
                           results.connection.saveData ||
                           results.device.type === 'mobile',
      darkMode: results.system.prefersDarkMode,
      allowsLocalStorage: results.capabilities.localStorage,
      audioSupport: results.capabilities.webAudio
    };
  }
  
  /**
   * Check if WebGL 2 is supported
   * @returns {boolean} - True if WebGL 2 is supported
   */
  static supportsWebGL2() {
    const results = this.detect();
    return results.capabilities.webgl2;
  }
  
  /**
   * Check if the device is mobile
   * @returns {boolean} - True if device is mobile
   */
  static isMobile() {
    const results = this.detect();
    return results.device.type === 'mobile';
  }
  
  /**
   * Check if the device is a tablet
   * @returns {boolean} - True if device is a tablet
   */
  static isTablet() {
    const results = this.detect();
    return results.device.type === 'tablet';
  }
  
  /**
   * Check if the device supports touch
   * @returns {boolean} - True if device supports touch
   */
  static supportsTouch() {
    const results = this.detect();
    return results.device.touchCapable;
  }
  
  /**
   * Get the device performance category
   * @returns {string} - 'low', 'medium', or 'high'
   */
  static getPerformanceCategory() {
    const results = this.detect();
    return results.performance.category;
  }
  
  /**
   * Check if the device has a high-end GPU
   * @returns {boolean} - True if device has a high-end GPU
   */
  static hasHighEndGPU() {
    const results = this.detect();
    return results.gpu.tier === 'high';
  }
  
  /**
   * Check if the browser is supported
   * @returns {boolean} - True if the browser is supported
   */
  static isBrowserSupported() {
    const results = this.detect();
    return results.browser.supported;
  }
  
  /**
   * Check if the user prefers reduced motion
   * @returns {boolean} - True if the user prefers reduced motion
   */
  static prefersReducedMotion() {
    const results = this.detect();
    return results.system.prefersReducedMotion;
  }
  
  /**
   * Check if the user prefers dark mode
   * @returns {boolean} - True if the user prefers dark mode
   */
  static prefersDarkMode() {
    const results = this.detect();
    return results.system.prefersDarkMode;
  }
  
  /**
   * Check if the connection is slow (2G or slow 3G)
   * @returns {boolean} - True if connection is slow
   */
  static isConnectionSlow() {
    const results = this.detect();
    return results.connection.type === '2g' || 
           results.connection.type === 'slow-2g' || 
           results.connection.downlinkSpeed < 0.5;
  }
  
  /**
   * Check if the device is in battery saving mode or has requested data saving
   * @returns {boolean} - True if the device is in power saving mode
   */
  static isPowerSavingMode() {
    const results = this.detect();
    
    // Logic to determine if power saving is likely enabled based on available signals
    return results.connection.saveData || 
           results.system.prefersReducedMotion || 
           (results.device.type === 'mobile' && results.performance.category === 'low');
  }
  
  /**
   * Get recommendation for quality settings based on device
   * @returns {string} - 'low', 'medium', or 'high'
   */
  static getRecommendedQuality() {
    const results = this.detect();
    
    // Logic to determine recommended quality settings
    if (results.gpu.tier === 'low' || results.performance.category === 'low') {
      return 'low';
    } else if (results.gpu.tier === 'high' && results.performance.category !== 'low') {
      return 'high';
    } else {
      return 'medium';
    }
  }
  
  /**
   * Check if WebGL is adequately supported for the application
   * @returns {boolean} - True if WebGL is adequately supported
   */
  static hasAdequateWebGLSupport() {
    const results = this.detect();
    
    // At minimum, we need basic WebGL support
    if (!results.capabilities.webgl) {
      return false;
    }
    
    // Ideally, we want WebGL 2 for higher-end features
    const hasWebGL2 = results.capabilities.webgl2;
    
    // For low-tier GPUs, we might need to check more carefully
    if (results.gpu.tier === 'low') {
      // Additional checks for problematic GPU/driver combinations could be added here
      
      // For now, we'll just ensure WebGL 1 is available for low-tier devices
      return true;
    }
    
    // For mid and high tier, we ideally want WebGL 2
    return hasWebGL2;
  }
}

export default DeviceDetector;