/**
 * Orchestrator.js
 * 
 * The "brain" of the experience that uses AI to coordinate and adapt
 * the visualization, audio, and interaction to create a cohesive experience.
 */

import { Performance } from '../utils/Performance';
import { StateAnalyzer } from './StateAnalyzer';
import { DecisionEngine } from './DecisionEngine';
import { Transitions } from './Transitions';
import { OpenAIClient } from './openai/OpenAIClient';
import { PromptTemplates } from './openai/PromptTemplates';

export class Orchestrator {
  /**
   * Initialize the Orchestrator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    
    // Core systems to orchestrate
    this.fractalEngine = options.fractalEngine;
    this.audioEngine = options.audioEngine;
    this.inputHandler = options.inputHandler;
    this.uiController = options.uiController;
    
    // Orchestration modules
    this.stateAnalyzer = null;
    this.decisionEngine = null;
    this.transitions = null;
    
    // OpenAI client
    this.openai = null;
    
    // State tracking
    this.currentState = {
      mode: 'initializing',
      adaptationLevel: 0.5, // 0-1 scale of how much AI drives the experience
      quantumRandomness: 0.3, // 0-1 scale of unpredictability
      lastUserInteraction: Date.now(),
      sessionStartTime: Date.now(),
      adaptationHistory: [],
      userInteractions: []
    };
    
    // Orchestration intervals
    this.adaptationInterval = null;
    this.adaptationPeriod = 30000; // Default: adapt every 30 seconds
    
    // Modes for different experiences
    this.modes = {
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
    };
    
    // User interaction history (for analysis)
    this.interactionHistory = [];
    
    // Event handlers
    this.eventHandlers = {
      onModeChange: [],
      onAIDecision: [],
      onQuantumEvent: []
    };
    
    // Bind methods
    this.adapt = this.adapt.bind(this);
    this.processUserInteraction = this.processUserInteraction.bind(this);
  }
  
  /**
   * Initialize the orchestrator
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('orchestrator-init-start');
    
    try {
      console.log('Initializing AI Orchestrator...');
      
      // Initialize OpenAI client
      this.openai = new OpenAIClient({
        model: this.config.aiModel || 'gpt-4-turbo',
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 500,
        simulateResponses: this.config.simulateResponses || false
      });
      
      // Initialize state analyzer
      this.stateAnalyzer = new StateAnalyzer({
        config: this.config.stateAnalyzer
      });
      await this.stateAnalyzer.initialize();
      
      // Initialize decision engine
      this.decisionEngine = new DecisionEngine({
        config: this.config.decisionEngine,
        openai: this.openai
      });
      await this.decisionEngine.initialize();
      
      // Initialize transitions
      this.transitions = new Transitions({
        fractalEngine: this.fractalEngine,
        audioEngine: this.audioEngine,
        config: this.config.transitions
      });
      await this.transitions.initialize();
      
      // Update from config
      this.updateFromConfig();
      
      // Register event listeners
      this.registerEventListeners();
      
      Performance.mark('orchestrator-init-end');
      Performance.measure(
        'orchestrator-initialization',
        'orchestrator-init-start',
        'orchestrator-init-end'
      );
      
      console.log('AI Orchestrator initialized', Performance.getLastMeasure('orchestrator-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize Orchestrator:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Update from configuration
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Update adaptation level
    if (this.config.adaptationLevel !== undefined) {
      this.currentState.adaptationLevel = this.config.adaptationLevel;
    }
    
    // Update quantum randomness
    if (this.config.quantumRandomness !== undefined) {
      this.currentState.quantumRandomness = this.config.quantumRandomness;
    }
    
    // Update adaptation period
    if (this.config.adaptationPeriod) {
      this.adaptationPeriod = this.config.adaptationPeriod;
    }
    
    // Apply initial mode
    if (this.config.initialMode && this.modes[this.config.initialMode]) {
      this.setMode(this.config.initialMode);
    } else {
      // Default to contemplative mode
      this.setMode('contemplative');
    }
  }
  
  /**
   * Register event listeners to system components
   */
  registerEventListeners() {
    // Listen for user interactions
    if (this.inputHandler) {
      this.inputHandler.addEventListener('interaction', this.processUserInteraction);
    }
    
    // Listen for fractal changes
    if (this.fractalEngine) {
      this.fractalEngine.addEventListener('onParameterChange', (data) => {
        this.stateAnalyzer.updateFractalState(data);
      });
    }
    
    // Listen for audio analysis
    if (this.audioEngine) {
      this.audioEngine.addEventListener('onAnalysis', (data) => {
        this.stateAnalyzer.updateAudioState(data);
      });
      
      this.audioEngine.addEventListener('onBeat', (data) => {
        this.checkForQuantumEvent('beat', data);
      });
    }
  }
  
  /**
   * Start the orchestrator
   */
  start() {
    console.log('Starting AI Orchestrator...');
    
    // Start periodic adaptation
    this.startAdaptation();
    
    // Initial adaptation
    setTimeout(() => {
      this.adapt();
    }, 5000); // Wait 5 seconds for initial adaptation
    
    console.log('AI Orchestrator started');
  }
  
  /**
   * Stop the orchestrator
   */
  stop() {
    console.log('Stopping AI Orchestrator...');
    
    // Stop periodic adaptation
    this.stopAdaptation();
    
    console.log('AI Orchestrator stopped');
  }
  
  /**
   * Start periodic adaptation
   */
  startAdaptation() {
    // Clear any existing interval
    this.stopAdaptation();
    
    // Start a new adaptation interval
    this.adaptationInterval = setInterval(
      this.adapt,
      this.adaptationPeriod
    );
    
    console.log(`Adaptation started with period: ${this.adaptationPeriod}ms`);
  }
  
  /**
   * Stop periodic adaptation
   */
  stopAdaptation() {
    if (this.adaptationInterval) {
      clearInterval(this.adaptationInterval);
      this.adaptationInterval = null;
    }
  }
  
  /**
   * Process a user interaction
   * @param {Object} interaction - Interaction data
   */
  processUserInteraction(interaction) {
    // Record the interaction
    this.interactionHistory.push({
      ...interaction,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift();
    }
    
    // Update last interaction time
    this.currentState.lastUserInteraction = Date.now();
    
    // Update state analyzer
    this.stateAnalyzer.updateInteractionState(interaction);
    
    // Check if we should adapt based on this interaction
    if (interaction.type === 'modeChange' || 
        interaction.type === 'aiPrompt' || 
        interaction.type === 'preset') {
      // Important interaction, adapt immediately
      this.adapt();
    } else if (interaction.intensity && interaction.intensity > 0.8) {
      // High intensity interaction, adapt with probability
      if (Math.random() < 0.5) {
        this.adapt();
      }
    }
    
    // Check for quantum event
    this.checkForQuantumEvent('interaction', interaction);
  }
  
  /**
   * Main adaptation function - analyze and adapt the experience
   */
  async adapt() {
    Performance.mark('adaptation-start');
    
    try {
      console.log('Adapting experience...');
      
      // Skip adaptation if adaptation level is near zero
      if (this.currentState.adaptationLevel < 0.1) {
        console.log('Adaptation skipped (low adaptation level)');
        return;
      }
      
      // 1. Gather current state
      const systemState = this.gatherSystemState();
      
      // 2. Analyze state
      const analysis = await this.stateAnalyzer.analyze(systemState);
      
      // 3. Make decisions based on analysis
      const decisions = await this.decisionEngine.decide(analysis);
      
      // 4. Apply decisions
      await this.applyDecisions(decisions);
      
      // 5. Record adaptation for history
      this.currentState.adaptationHistory.push({
        timestamp: Date.now(),
        analysis,
        decisions
      });
      
      // Limit history size
      if (this.currentState.adaptationHistory.length > 20) {
        this.currentState.adaptationHistory.shift();
      }
      
      // Dispatch event
      this.dispatchEvent('onAIDecision', {
        analysis,
        decisions,
        systemState
      });
      
      Performance.mark('adaptation-end');
      Performance.measure('adaptation', 'adaptation-start', 'adaptation-end');
      console.log('Adaptation complete', Performance.getLastMeasure('adaptation'));
      
    } catch (error) {
      console.error('Adaptation failed:', error);
      Performance.mark('adaptation-end');
      Performance.measure('adaptation-failed', 'adaptation-start', 'adaptation-end');
    }
  }
  
  /**
   * Gather current system state
   * @returns {Object} - Complete system state
   */
  gatherSystemState() {
    const now = Date.now();
    
    return {
      timestamp: now,
      sessionDuration: (now - this.currentState.sessionStartTime) / 1000, // in seconds
      timeSinceLastInteraction: (now - this.currentState.lastUserInteraction) / 1000, // in seconds
      
      // Current state
      mode: this.currentState.mode,
      adaptationLevel: this.currentState.adaptationLevel,
      quantumRandomness: this.currentState.quantumRandomness,
      
      // Fractal state
      fractal: this.fractalEngine ? this.fractalEngine.getState() : null,
      
      // Audio state
      audio: this.audioEngine ? this.audioEngine.getState() : null,
      
      // Interaction state
      interactions: this.interactionHistory.slice(-20), // Last 20 interactions
      
      // Previous adaptations
      adaptationHistory: this.currentState.adaptationHistory.slice(-5) // Last 5 adaptations
    };
  }
  
  /**
   * Apply decisions from the decision engine
   * @param {Object} decisions - Decisions to apply
   * @returns {Promise} - Resolves when all decisions are applied
   */
  async applyDecisions(decisions) {
    if (!decisions) return Promise.resolve();
    
    const promises = [];
    
    // Apply mode change if requested
    if (decisions.mode && decisions.mode !== this.currentState.mode) {
      promises.push(this.setMode(decisions.mode, { transition: true }));
    }
    
    // Apply fractal changes
    if (decisions.fractal) {
      if (decisions.fractal.type && decisions.fractal.type !== this.fractalEngine.activeRenderer) {
        // Change fractal type
        this.fractalEngine.setFractalType(decisions.fractal.type);
      }
      
      if (decisions.fractal.parameters) {
        // Apply parameters with transition
        promises.push(
          this.transitions.transitionFractal(decisions.fractal.parameters)
        );
      }
    }
    
    // Apply audio changes
    if (decisions.audio && this.audioEngine) {
      promises.push(
        this.transitions.transitionAudio(decisions.audio)
      );
    }
    
    // Apply UI changes/prompts
    if (decisions.ui && this.uiController) {
      if (decisions.ui.prompt) {
        this.uiController.showPrompt(decisions.ui.prompt);
      }
      
      if (decisions.ui.highlight) {
        this.uiController.highlightElement(decisions.ui.highlight);
      }
    }
    
    // Wait for all transitions to complete
    return Promise.all(promises);
  }
  
  /**
   * Set the current experience mode
   * @param {string} modeName - Mode name
   * @param {Object} options - Options for mode change
   * @returns {Promise} - Resolves when mode change is complete
   */
  async setMode(modeName, options = {}) {
    const mode = this.modes[modeName];
    if (!mode) {
      console.error(`Mode not found: ${modeName}`);
      return Promise.reject(new Error(`Mode not found: ${modeName}`));
    }
    
    console.log(`Changing mode to: ${modeName}`);
    
    const oldMode = this.currentState.mode;
    this.currentState.mode = modeName;
    
    const promises = [];
    
    // Apply fractal settings
    if (mode.fractal && this.fractalEngine) {
      if (mode.fractal.type) {
        this.fractalEngine.setFractalType(mode.fractal.type);
      }
      
      if (options.transition) {
        promises.push(
          this.transitions.transitionFractal(mode.fractal)
        );
      } else {
        this.fractalEngine.setParameters(mode.fractal);
      }
    }
    
    // Apply audio settings
    if (mode.audio && this.audioEngine) {
      if (options.transition) {
        promises.push(
          this.transitions.transitionAudio(mode.audio)
        );
      } else {
        this.audioEngine.setParameters(mode.audio);
      }
    }
    
    // Apply timing settings
    if (mode.timing) {
      if (mode.timing.adaptationPeriod) {
        this.adaptationPeriod = mode.timing.adaptationPeriod;
        // Restart adaptation with new period
        this.startAdaptation();
      }
    }
    
    // Notify listeners
    this.dispatchEvent('onModeChange', {
      oldMode,
      newMode: modeName,
      modeConfig: mode
    });
    
    // Wait for all transitions to complete
    return Promise.all(promises);
  }
  
  /**
   * Check if a quantum random event should occur
   * @param {string} trigger - What triggered the potential event
   * @param {Object} data - Additional data about the trigger
   */
  checkForQuantumEvent(trigger, data) {
    // Skip if randomness is low
    if (this.currentState.quantumRandomness < 0.1) return;
    
    // Calculate probability based on randomness level
    const baseProbability = this.currentState.quantumRandomness * 0.1;
    let probability = baseProbability;
    
    // Adjust probability based on context
    if (trigger === 'beat' && data.energy > 0.7) {
      probability *= 2; // Higher probability during energetic beats
    } else if (trigger === 'interaction' && data.intensity > 0.8) {
      probability *= 3; // Higher probability during intense interactions
    }
    
    // Roll the dice
    if (Math.random() < probability) {
      this.triggerQuantumEvent(trigger, data);
    }
  }
  
  /**
   * Trigger a quantum random event
   * @param {string} trigger - What triggered the event
   * @param {Object} data - Additional data about the trigger
   */
  async triggerQuantumEvent(trigger, data) {
    console.log(`Quantum event triggered by: ${trigger}`);
    
    // Generate a random event type
    const eventTypes = [
      'colorShift',
      'zoomPulse',
      'rotationBurst',
      'dimensionRift',
      'harmonicShift'
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Apply the event
    switch (eventType) {
      case 'colorShift':
        // Sudden shift in color palette
        if (this.fractalEngine) {
          const hueShift = Math.random();
          this.fractalEngine.setParameter('colorShift', hueShift);
        }
        break;
        
      case 'zoomPulse':
        // Quick zoom in and out
        if (this.fractalEngine) {
          const currentZoom = this.fractalEngine.parameters.zoom;
          const targetZoom = currentZoom * (1 + Math.random());
          
          await this.transitions.transitionFractal({ zoom: targetZoom }, 1.0);
          await this.transitions.transitionFractal({ zoom: currentZoom }, 1.0);
        }
        break;
        
      case 'rotationBurst':
        // Quick rotation
        if (this.fractalEngine) {
          const currentAngle = this.fractalEngine.parameters.rotationAngle;
          const targetAngle = currentAngle + (Math.random() * Math.PI / 4);
          
          await this.transitions.transitionFractal({ rotationAngle: targetAngle }, 0.5);
        }
        break;
        
      case 'dimensionRift':
        // Briefly change fractal type then return
        if (this.fractalEngine) {
          const currentType = this.fractalEngine.activeRenderer;
          const fractalTypes = Object.keys(this.fractalEngine.renderers);
          const randomType = fractalTypes.filter(t => t !== currentType)[
            Math.floor(Math.random() * (fractalTypes.length - 1))
          ];
          
          this.fractalEngine.setFractalType(randomType);
          setTimeout(() => {
            this.fractalEngine.setFractalType(currentType);
          }, 2000 + Math.random() * 3000); // Return after 2-5 seconds
        }
        break;
        
      case 'harmonicShift':
        // Shift in audio harmonics
        if (this.audioEngine) {
          const baseFreq = this.audioEngine.parameters.baseFrequency;
          const harmonicRatios = [...this.audioEngine.parameters.harmonicRatios];
          
          // Modify a few ratios
          for (let i = 0; i < 2; i++) {
            const index = Math.floor(Math.random() * harmonicRatios.length);
            harmonicRatios[index] *= 0.9 + Math.random() * 0.2; // 0.9 to 1.1
          }
          
          await this.transitions.transitionAudio({ 
            harmonicRatios,
            baseFrequency: baseFreq * (0.95 + Math.random() * 0.1) // Slight shift
          }, 2.0);
          
          // Return to original after a while
          setTimeout(() => {
            this.transitions.transitionAudio({ 
              harmonicRatios: this.audioEngine.parameters.harmonicRatios,
              baseFrequency: baseFreq
            }, 3.0);
          }, 5000 + Math.random() * 5000); // Return after 5-10 seconds
        }
        break;
    }
    
    // Notify listeners
    this.dispatchEvent('onQuantumEvent', {
      eventType,
      trigger,
      triggerData: data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Process a natural language request from the user
   * @param {string} prompt - User's natural language request
   * @returns {Promise<Object>} - AI response and actions taken
   */
  async processNaturalLanguageRequest(prompt) {
    console.log('Processing natural language request:', prompt);
    
    try {
      // Gather current system state for context
      const systemState = this.gatherSystemState();
      
      // Create a prompt for OpenAI
      const promptTemplate = PromptTemplates.processNaturalLanguageInput({
        userInput: prompt,
        currentFractal: this.fractalEngine ? this.fractalEngine.activeRenderer : 'mandelbrot',
        currentMood: this.currentState.mode,
        explorationDepth: systemState.sessionDuration < 300 ? 'shallow' : 
                         (systemState.sessionDuration < 900 ? 'medium' : 'deep')
      });
      
      // Send to OpenAI
      const response = await this.openai.createCompletion(
        promptTemplate.userMessage,
        {
          system_message: promptTemplate.systemMessage
        }
      );
      
      // Parse the response
      let parsedResponse;
      try {
        const responseText = response.choices[0].message.content;
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        parsedResponse = {
          intent: { primary: 'unknown' },
          parameters: {},
          interpretation: 'I couldn\'t understand your request fully. Could you rephrase it?'
        };
      }
      
      // Take actions based on the interpreted intent
      const actions = await this.executeIntentActions(parsedResponse);
      
      return {
        originalPrompt: prompt,
        interpretation: parsedResponse.interpretation,
        actions,
        parameters: parsedResponse.parameters
      };
      
    } catch (error) {
      console.error('Natural language processing failed:', error);
      return {
        originalPrompt: prompt,
        interpretation: 'I encountered an error processing your request.',
        actions: [],
        error: error.message
      };
    }
  }
  
  /**
   * Execute actions based on interpreted user intent
   * @param {Object} interpretation - Parsed AI interpretation
   * @returns {Promise<Array>} - Actions taken
   */
  async executeIntentActions(interpretation) {
    if (!interpretation || !interpretation.intent) {
      return [];
    }
    
    const intent = interpretation.intent;
    const parameters = interpretation.parameters || {};
    const actions = [];
    
    switch (intent.primary) {
      case 'change_fractal':
        if (parameters.fractal && parameters.fractal.type) {
          this.fractalEngine.setFractalType(parameters.fractal.type);
          actions.push(`Changed fractal to ${parameters.fractal.type}`);
        }
        
        if (parameters.fractal && Object.keys(parameters.fractal).length > 1) {
          // Apply other fractal parameters
          const fractalParams = { ...parameters.fractal };
          delete fractalParams.type;
          
          await this.transitions.transitionFractal(fractalParams);
          actions.push('Applied fractal parameters');
        }
        break;
        
      case 'adjust_mood':
        if (parameters.mood && parameters.mood.primary) {
          // Find closest mode to the requested mood
          const targetMood = parameters.mood.primary.toLowerCase();
          let bestMode = null;
          let bestScore = -1;
          
          const moodMappings = {
            'contemplative': ['calm', 'peaceful', 'meditative', 'reflective', 'serene'],
            'exploratory': ['curious', 'inquisitive', 'discovery', 'wandering', 'adventure'],
            'energetic': ['excited', 'dynamic', 'lively', 'vibrant', 'intense'],
            'quantum': ['mysterious', 'weird', 'strange', 'unpredictable', 'chaotic']
          };
          
          for (const [mode, moods] of Object.entries(moodMappings)) {
            if (mode === targetMood || moods.includes(targetMood)) {
              bestMode = mode;
              bestScore = 1;
              break;
            }
            
            // Calculate similarity score
            const score = moods.reduce((acc, mood) => {
              return targetMood.includes(mood) || mood.includes(targetMood) ? acc + 0.5 : acc;
            }, 0);
            
            if (score > bestScore) {
              bestScore = score;
              bestMode = mode;
            }
          }
          
          if (bestMode) {
            await this.setMode(bestMode, { transition: true });
            actions.push(`Changed to ${bestMode} mode`);
          }
        }
        break;
        
      case 'modify_sound':
        if (parameters.sound && Object.keys(parameters.sound).length > 0) {
          const audioParams = {};
          
          if (parameters.sound.style) {
            // Map style to audio parameters
            switch (parameters.sound.style.toLowerCase()) {
              case 'ambient':
              case 'calm':
                audioParams.tempo = 0;
                audioParams.binauralBeat = 7.83;
                break;
              case 'rhythmic':
              case 'pulsing':
                audioParams.tempo = 60 + Math.floor(Math.random() * 30);
                audioParams.pulseRate = 0.25;
                break;
              case 'harmonic':
              case 'melodic':
                audioParams.harmonicRatios = [1, 1.5, 2, 2.5, 3, 4, 5, 6];
                break;
              case 'deep':
              case 'bass':
                audioParams.baseFrequency = 174;
                audioParams.filterCutoff = 800;
                break;
              case 'bright':
              case 'high':
                audioParams.baseFrequency = 528;
                audioParams.filterCutoff = 2000;
                break;
            }
          }
          
          if (parameters.sound.intensity) {
            const intensity = parameters.sound.intensity / 10; // Normalize to 0-1
            audioParams.volume = 0.2 + intensity * 0.6;
          }
          
          if (parameters.sound.tempo) {
            switch (parameters.sound.tempo.toLowerCase()) {
              case 'fast':
                audioParams.tempo = 90;
                break;
              case 'moderate':
                audioParams.tempo = 72;
                break;
              case 'slow':
                audioParams.tempo = 52;
                break;
              case 'none':
              case 'still':
                audioParams.tempo = 0;
                break;
            }
          }
          
          await this.transitions.transitionAudio(audioParams);
          actions.push('Modified sound environment');
        }
        break;
        
      case 'explore_deeper':
        {
          // Increase zoom level
          const currentZoom = this.fractalEngine.parameters.zoom;
          const newZoom = currentZoom * (2 + Math.random() * 3); // 2-5x deeper
          
          await this.transitions.transitionFractal({ zoom: newZoom }, 3.0);
          actions.push(`Zoomed deeper (${newZoom.toFixed(2)}x)`);
          
          // Adjust audio to match deeper exploration
          const lowerFreq = this.audioEngine.parameters.baseFrequency * 0.9;
          await this.transitions.transitionAudio({ baseFrequency: lowerFreq }, 3.0);
          actions.push('Shifted to deeper audio frequency');
        }
        break;
        
      case 'randomize':
        {
          // Create a somewhat random but coherent experience
          const fractalTypes = ['mandelbrot', 'julia', 'burningShip', 'hyperbolic'];
          const randomType = fractalTypes[Math.floor(Math.random() * fractalTypes.length)];
          
          const randomParams = {
            fractal: {
              type: randomType,
              centerX: -0.5 + Math.random(),
              centerY: -0.5 + Math.random(),
              zoom: 0.5 + Math.random() * 2,
              colorShift: Math.random()
            },
            audio: {
              baseFrequency: 220 + Math.random() * 440,
              tempo: Math.random() > 0.5 ? (60 + Math.random() * 30) : 0,
              binauralBeat: 7 + Math.random() * 8
            }
          };
          
          this.fractalEngine.setFractalType(randomParams.fractal.type);
          await this.transitions.transitionFractal(randomParams.fractal);
          await this.transitions.transitionAudio(randomParams.audio);
          
          actions.push('Created a randomized experience');
        }
        break;
    }
    
    return actions;
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
   * Get the current state of the orchestrator
   * @returns {Object} - Current state
   */
  getState() {
    return {
      ...this.currentState,
      sessionDuration: (Date.now() - this.currentState.sessionStartTime) / 1000,
      timeSinceLastInteraction: (Date.now() - this.currentState.lastUserInteraction) / 1000,
      interactionCount: this.interactionHistory.length,
      adaptationCount: this.currentState.adaptationHistory.length
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    
    // Remove event listeners
    if (this.inputHandler) {
      this.inputHandler.removeEventListener('interaction', this.processUserInteraction);
    }
    
    // Clear event handlers
    Object.keys(this.eventHandlers).forEach(event => {
      this.eventHandlers[event] = [];
    });
    
    // Dispose modules
    if (this.stateAnalyzer && typeof this.stateAnalyzer.dispose === 'function') {
      this.stateAnalyzer.dispose();
    }
    
    if (this.decisionEngine && typeof this.decisionEngine.dispose === 'function') {
      this.decisionEngine.dispose();
    }
    
    if (this.transitions && typeof this.transitions.dispose === 'function') {
      this.transitions.dispose();
    }
    
    console.log('Orchestrator disposed');
  }
}

export default Orchestrator;