/**
 * AppConfig.js
 * 
 * Global configuration settings for the application.
 * Centralizes all configuration in one place and adjusts based on
 * device capabilities.
 */

// Default configuration
const DEFAULT_CONFIG = {
    // General settings
    general: {
      appName: 'Recursive Mathematical Dreamscape',
      version: '0.1.0',
      debug: false,
      theme: 'dark',
      initialMode: 'contemplative'
    },
    
    // Visualization settings
    visualization: {
      quality: 1.0, // Scale factor for rendering quality (0.5 to 2.0)
      maxIterations: 200,
      defaultFractal: 'mandelbrot',
      effectsEnabled: true,
      audioReactive: true,
      
      // Renderer-specific settings
      renderers: {
        mandelbrot: {
          centerX: 0,
          centerY: 0,
          zoom: 1,
          colorShift: 0,
          iterations: 100,
          exponent: 2,
          bailout: 4,
          colorMode: 0,
          colorCycles: 3,
          palette: [
            [0.0, 0.0, 0.0], // Black
            [0.1, 0.3, 0.6], // Deep blue
            [0.1, 0.5, 0.9], // Blue
            [0.0, 0.8, 1.0], // Cyan
            [0.0, 1.0, 0.4], // Green-cyan
            [1.0, 1.0, 0.0], // Yellow
            [1.0, 0.6, 0.0], // Orange
            [1.0, 0.0, 0.0]  // Red
          ]
        },
        
        julia: {
          centerX: 0,
          centerY: 0,
          zoom: 1,
          colorShift: 0,
          iterations: 100,
          juliaReal: -0.7,
          juliaImag: 0.27,
          exponent: 2,
          bailout: 4,
          colorMode: 0,
          colorCycles: 3,
          palette: [
            [0.0, 0.0, 0.3], // Deep blue
            [0.1, 0.2, 0.8], // Blue
            [0.2, 0.5, 1.0], // Light blue
            [0.0, 0.8, 0.8], // Cyan
            [0.0, 1.0, 0.6], // Teal
            [0.2, 0.8, 0.0], // Green
            [0.8, 1.0, 0.0], // Chartreuse
            [1.0, 0.8, 0.0]  // Yellow
          ]
        },
        
        burningShip: {
          centerX: -0.5,
          centerY: 0.5,
          zoom: 0.6,
          colorShift: 0.2,
          iterations: 100,
          exponent: 2,
          bailout: 4,
          colorMode: 0,
          colorCycles: 3,
          palette: [
            [0.0, 0.0, 0.0], // Black
            [0.3, 0.0, 0.0], // Dark red
            [0.6, 0.0, 0.0], // Red
            [0.9, 0.3, 0.0], // Orange-red
            [1.0, 0.6, 0.0], // Orange
            [1.0, 0.8, 0.0], // Yellow-orange
            [1.0, 1.0, 0.6], // Light yellow
            [1.0, 1.0, 1.0]  // White
          ]
        },
        
        mandelbulb: {
          iterations: 80, // Lower default for 3D due to complexity
          detail: 0.8,
          power: 8,
          colorShift: 0.5,
          rotationSpeed: 0.1,
          colorMode: 0,
          colorCycles: 2,
          palette: [
            [0.0, 0.0, 0.2], // Dark blue
            [0.0, 0.0, 0.6], // Blue
            [0.0, 0.4, 0.8], // Light blue
            [0.0, 0.8, 0.8], // Cyan
            [0.4, 0.8, 0.4], // Green
            [0.8, 0.8, 0.0], // Yellow
            [0.8, 0.4, 0.0], // Orange
            [0.6, 0.0, 0.0]  // Red
          ]
        },
        
        hyperbolic: {
          centerX: 0,
          centerY: 0,
          zoom: 1,
          colorShift: 0.3,
          iterations: 50,
          sides: 7,
          scale: 2,
          colorMode: 0,
          colorCycles: 2,
          palette: [
            [0.2, 0.0, 0.4], // Purple
            [0.4, 0.0, 0.6], // Violet
            [0.6, 0.0, 0.8], // Light purple
            [0.8, 0.0, 1.0], // Magenta
            [1.0, 0.0, 0.8], // Pink
            [1.0, 0.0, 0.4], // Rose
            [0.6, 0.0, 0.2], // Dark red
            [0.4, 0.0, 0.0]  // Deep red
          ]
        }
      },
      
      // Effects settings
      effects: {
        bloom: {
          enabled: true,
          strength: 0.7,
          threshold: 0.6,
          radius: 0.4
        },
        feedback: {
          enabled: true,
          strength: 0.15,
          decay: 0.97
        },
        colorCycler: {
          enabled: true,
          speed: 0.05
        }
      }
    },
    
    // Audio settings
    audio: {
      masterVolume: 0.5,
      autoStart: true,
      baseFrequency: 432, // A=432Hz (alternative to standard 440Hz)
      binauralBeat: 7.83, // Schumann resonance frequency
      harmonicRatios: [1, 1.5, 2, 2.5, 3, 4, 5, 6], // Harmonic series ratios
      tempo: 60, // BPM
      pulseRate: 0.25, // Quarter notes
      
      // Effects
      effects: {
        reverb: {
          enabled: true,
          decay: 1.5,
          wet: 0.3
        },
        delay: {
          enabled: true,
          time: 0.5,
          feedback: 0.3,
          wet: 0.2
        },
        filter: {
          enabled: true,
          type: 'lowpass',
          frequency: 1000,
          Q: 1
        }
      },
      
      // Analysis settings
      analysis: {
        fftSize: 1024,
        smoothing: 0.8,
        binCount: 128,
        bassRange: [20, 250],
        midRange: [250, 2000],
        trebleRange: [2000, 20000]
      },
      
      // Beat detection settings
      beatDetection: {
        sensitivity: 0.5,
        minTreshold: 0.3,
        historySize: 10
      },
      
      // Binaural settings
      binaural: {
        enabled: true,
        waveform: 'sine'
      },
      
      // Harmonics settings
      harmonics: {
        enabled: true,
        baseWaveform: 'sine',
        overtoneWaveform: 'sine',
        overtoneCount: 6,
        overtoneDecay: 0.7
      }
    },
    
    // Interaction settings
    interaction: {
      // Mouse/Touch settings
      mouse: {
        dragThreshold: 3,
        zoomSpeed: 1.0,
        panSpeed: 1.0,
        rotateSpeed: 0.01
      },
      
      // Keyboard settings
      keyboard: {
        enabled: true,
        shortcuts: {
          'r': 'resetView',
          '+': 'zoomIn',
          '-': 'zoomOut',
          'm': 'toggleAudio',
          's': 'screenshot',
          'f': 'toggleFullscreen'
        }
      },
      
      // Mobile settings
      mobile: {
        gesturesEnabled: true,
        vibrateOnInteraction: true,
        adaptiveUI: true
      }
    },
    
    // UI settings
    ui: {
      controlsVisible: true,
      infoVisible: false,
      theme: 'dark',
      adaptiveTheme: false, // Change theme based on system preference
      tooltipsEnabled: true,
      notificationsEnabled: true,
      notificationDuration: 5000, // ms
      
      // Preset configurations
      presets: {
        'classic': {
          fractalType: 'mandelbrot',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1,
            iterations: 100,
            colorShift: 0
          }
        },
        'spiral': {
          fractalType: 'julia',
          parameters: {
            juliaReal: -0.7269,
            juliaImag: 0.1889,
            zoom: 1,
            iterations: 100,
            colorShift: 0.3
          }
        },
        'deep-zoom': {
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -1.7490367461950737,
            centerY: 0.0000000003385576,
            zoom: 1e+11,
            iterations: 500,
            colorShift: 0.5
          }
        },
        'seahorse': {
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.743644786,
            centerY: 0.1318252536,
            zoom: 80,
            iterations: 150,
            colorShift: 0.2
          }
        },
        'dendrite': {
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.2232796,
            centerY: -0.7273918,
            zoom: 40,
            iterations: 100,
            colorShift: 0.7
          }
        },
        'julia-islands': {
          fractalType: 'julia',
          parameters: {
            juliaReal: 0.12,
            juliaImag: 0.64,
            zoom: 1.1,
            iterations: 120,
            colorShift: 0.4
          }
        }
      }
    },
    
    // AI Orchestration settings
    ai: {
      adaptationLevel: 0.5, // How much AI drives the experience (0-1)
      quantumRandomness: 0.3, // Level of unpredictability (0-1)
      adaptationPeriod: 30000, // How often the AI considers adaptation (ms)
      initialMode: 'contemplative',
      apiModel: 'gpt-4-turbo', // OpenAI model to use
      
      // Modes for different experiences
      modes: {
        contemplative: {
          fractal: { type: 'mandelbrot', zoom: 1.5, iterations: 200 },
          audio: { tempo: 0, binauralBeat: 7.83, baseFrequency: 432 },
          timing: { adaptationPeriod: 45000 }
        },
        exploratory: {
          fractal: { type: 'julia', zoom: 2, iterations: 150 },
          audio: { tempo: 60, binauralBeat: 10, baseFrequency: 528 },
          timing: { adaptationPeriod: 30000 }
        },
        energetic: {
          fractal: { type: 'mandelbulb', zoom: 1, iterations: 100 },
          audio: { tempo: 90, binauralBeat: 15, baseFrequency: 639 },
          timing: { adaptationPeriod: 20000 }
        },
        quantum: {
          fractal: { type: 'hyperbolic', zoom: 1, iterations: 120 },
          audio: { tempo: 72, binauralBeat: 12, baseFrequency: 396 },
          timing: { adaptationPeriod: 25000 }
        }
      },
      
      // State analyzer settings
      stateAnalyzer: {
        analysisPeriod: 2000, // How often to analyze state (ms)
        features: {
          interactionRate: true,
          exploreDepth: true,
          audioBehavior: true,
          visualPreference: true
        }
      },
      
      // Decision engine settings
      decisionEngine: {
        thresholds: {
          boredom: 0.7, // Threshold to detect user boredom
          overwhelm: 0.8, // Threshold to detect user overwhelm
          engagement: 0.6 // Threshold to detect user engagement
        },
        weights: {
          interactionRecency: 0.7,
          interactionDiversity: 0.6,
          explorationDepth: 0.8,
          audioResponse: 0.5
        }
      },
      
      // Transition settings
      transitions: {
        defaultDuration: 2000, // Default transition duration (ms)
        maxDepthChange: 5, // Maximum zoom depth change per transition
        colorShiftSpeed: 0.3, // Speed of color transitions
        audioTransitionTime: 3000 // Audio transition time (ms)
      }
    }
  };
  
  // Environment-specific overrides
  const ENV_OVERRIDES = {
    development: {
      general: {
        debug: true
      },
      ai: {
        simulateResponses: true, // Use simulated AI responses in development
      }
    },
    production: {
      general: {
        debug: false
      },
      visualization: {
        // Slightly lower defaults for public site to ensure smooth experience
        maxIterations: 150
      }
    }
  };
  
  /**
   * AppConfig class to manage application configuration
   */
  export class AppConfig {
    /**
     * Initialize configuration
     * @param {Object} deviceCapabilities - Device capability information
     * @returns {Promise} - Resolves when configuration is initialized
     */
    static async initialize(deviceCapabilities = {}) {
      // Get current environment (development or production)
      const env = process.env.NODE_ENV || 'development';
      
      // Start with default config
      this.config = { ...DEFAULT_CONFIG };
      
      // Apply environment-specific overrides
      if (ENV_OVERRIDES[env]) {
        this.mergeConfig(ENV_OVERRIDES[env]);
      }
      
      // Apply device-specific adjustments
      this.adjustForDevice(deviceCapabilities);
      
      // Apply any stored user preferences
      await this.applyUserPreferences();
      
      // Save initial config to allow resetting
      this.initialConfig = JSON.parse(JSON.stringify(this.config));
      
      console.log(`AppConfig initialized for ${env} environment`);
      return Promise.resolve(this.config);
    }
    
    /**
     * Merge config objects recursively
     * @param {Object} source - Source config to merge
     * @param {Object} target - Target config (default: this.config)
     */
    static mergeConfig(source, target = this.config) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (
            target[key] && 
            typeof source[key] === 'object' && 
            typeof target[key] === 'object' &&
            !Array.isArray(source[key]) &&
            !Array.isArray(target[key])
          ) {
            // Recursively merge objects
            this.mergeConfig(source[key], target[key]);
          } else {
            // Replace value
            target[key] = source[key];
          }
        }
      }
    }
    
    /**
     * Adjust configuration based on device capabilities
     * @param {Object} deviceCapabilities - Device capability information
     */
    static adjustForDevice(deviceCapabilities) {
      if (!deviceCapabilities) return;
      
      // Adjust based on GPU performance
      if (deviceCapabilities.gpu) {
        if (deviceCapabilities.gpu === 'high') {
          // High-end GPU can handle more
          this.config.visualization.quality = 1.5;
          this.config.visualization.maxIterations = 250;
          this.config.visualization.renderers.mandelbulb.iterations = 100;
        } else if (deviceCapabilities.gpu === 'low') {
          // Low-end devices need optimization
          this.config.visualization.quality = 0.75;
          this.config.visualization.maxIterations = 100;
          this.config.visualization.renderers.mandelbulb.iterations = 50;
          this.config.visualization.effects.bloom.enabled = false;
          this.config.visualization.effects.feedback.enabled = false;
        }
      }
      
      // Adjust for mobile devices
      if (deviceCapabilities.mobile) {
        this.config.visualization.quality = 0.8;
        this.config.visualization.maxIterations = 100;
        this.config.visualization.effects.feedback.enabled = false;
        this.config.ui.adaptiveUI = true;
      }
      
      // Adjust for screen size
      if (deviceCapabilities.screenSize === 'small') {
        this.config.ui.controlsVisible = false; // Start with controls hidden on small screens
      }
      
      // Adjust for audio capabilities
      if (deviceCapabilities.audioSupport === false) {
        this.config.audio.autoStart = false;
      }
      
      console.log('Configuration adjusted for device capabilities');
    }
    
    /**
     * Apply user preferences from localStorage
     * @returns {Promise} - Resolves when preferences are applied
     */
    static async applyUserPreferences() {
      try {
        // Check localStorage for saved preferences
        if (typeof localStorage !== 'undefined') {
          const savedPreferences = localStorage.getItem('appPreferences');
          if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            
            // Apply theme if saved
            if (preferences.theme) {
              this.config.ui.theme = preferences.theme;
            }
            
            // Apply volume if saved
            if (preferences.volume !== undefined) {
              this.config.audio.masterVolume = preferences.volume;
            }
            
            // Apply other preferences as needed
            if (preferences.adaptationLevel !== undefined) {
              this.config.ai.adaptationLevel = preferences.adaptationLevel;
            }
            
            if (preferences.quantumRandomness !== undefined) {
              this.config.ai.quantumRandomness = preferences.quantumRandomness;
            }
            
            console.log('User preferences applied');
          }
        }
        return Promise.resolve();
      } catch (error) {
        console.error('Error applying user preferences:', error);
        return Promise.resolve(); // Continue even if preferences can't be loaded
      }
    }
    
    /**
     * Save user preferences to localStorage
     * @param {Object} preferences - User preferences to save
     */
    static saveUserPreferences(preferences) {
      try {
        if (typeof localStorage !== 'undefined') {
          // Get existing preferences
          const existing = localStorage.getItem('appPreferences');
          const savedPreferences = existing ? JSON.parse(existing) : {};
          
          // Merge new preferences
          const updatedPreferences = { ...savedPreferences, ...preferences };
          
          // Save to localStorage
          localStorage.setItem('appPreferences', JSON.stringify(updatedPreferences));
          console.log('User preferences saved');
        }
      } catch (error) {
        console.error('Error saving user preferences:', error);
      }
    }
    
    /**
     * Reset configuration to initial state
     */
    static resetConfig() {
      if (this.initialConfig) {
        this.config = JSON.parse(JSON.stringify(this.initialConfig));
        console.log('Configuration reset to initial state');
      }
    }
    
    /**
     * Get configuration or a specific section
     * @param {string} section - Optional config section to get
     * @returns {Object} - Configuration object or section
     */
    static get(section) {
      if (section) {
        return this.config[section] || {};
      }
      return this.config;
    }
    
    /**
     * Update configuration
     * @param {string} section - Config section to update
     * @param {Object} updates - Updates to apply
     */
    static update(section, updates) {
      if (this.config[section]) {
        this.mergeConfig(updates, this.config[section]);
        console.log(`Updated config section: ${section}`);
        
        // If this is a user preference, save it
        if (['ui', 'audio', 'ai'].includes(section)) {
          // Extract user preference data
          const userPrefs = {};
          
          if (section === 'ui' && updates.theme) {
            userPrefs.theme = updates.theme;
          }
          
          if (section === 'audio' && updates.masterVolume !== undefined) {
            userPrefs.volume = updates.masterVolume;
          }
          
          if (section === 'ai') {
            if (updates.adaptationLevel !== undefined) {
              userPrefs.adaptationLevel = updates.adaptationLevel;
            }
            if (updates.quantumRandomness !== undefined) {
              userPrefs.quantumRandomness = updates.quantumRandomness;
            }
          }
          
          // Save if we have preferences to save
          if (Object.keys(userPrefs).length > 0) {
            this.saveUserPreferences(userPrefs);
          }
        }
      }
    }
  }
  
  // Export configuration sections for easy access
  export const general = () => AppConfig.get('general');
  export const visualization = () => AppConfig.get('visualization');
  export const audio = () => AppConfig.get('audio');
  export const interaction = () => AppConfig.get('interaction');
  export const ui = () => AppConfig.get('ui');
  export const ai = () => AppConfig.get('ai');
  
  // Export default AppConfig
  export default AppConfig;