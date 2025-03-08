/**
 * DecisionEngine.js
 * 
 * Makes decisions about how to adapt the experience based on
 * the current state and user behavior. Uses OpenAI for enhanced
 * decision making capabilities.
 */

import { Performance } from '../utils/Performance';
import { PromptTemplates } from './openai/PromptTemplates';

export class DecisionEngine {
  /**
   * Initialize the DecisionEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.openai = options.openai;
    
    // Decision thresholds and weights
    this.thresholds = {
      interactionGap: 30, // seconds without interaction before suggesting change
      engagementLevel: 0.5, // min engagement level for positive adaptation
      adaptationMagnitude: 0.3 // how dramatic adaptations should be (0-1)
    };
    
    // Update thresholds from config
    if (this.config.thresholds) {
      Object.assign(this.thresholds, this.config.thresholds);
    }
    
    // Decision history
    this.decisionHistory = [];
    
    // Bind methods
    this.decide = this.decide.bind(this);
  }
  
  /**
   * Initialize the decision engine
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    console.log('Initializing Decision Engine...');
    
    // Nothing to initialize currently
    
    return Promise.resolve();
  }
  
  /**
   * Make adaptation decisions based on current state
   * @param {Object} analysisResults - Results from StateAnalyzer
   * @returns {Promise<Object>} - Decision object with recommended changes
   */
  async decide(analysisResults) {
    Performance.mark('decision-start');
    
    try {
      // If we have OpenAI capabilities, use that for enhanced decisions
      if (this.openai) {
        const aiDecision = await this.makeAIDecision(analysisResults);
        
        // Record the decision
        this.recordDecision(aiDecision, analysisResults, 'ai');
        
        Performance.mark('decision-end');
        Performance.measure('decision-time', 'decision-start', 'decision-end');
        
        return aiDecision;
      }
      
      // Fallback to rule-based decisions if no AI
      const ruleBasedDecision = this.makeRuleBasedDecision(analysisResults);
      
      // Record the decision
      this.recordDecision(ruleBasedDecision, analysisResults, 'rule');
      
      Performance.mark('decision-end');
      Performance.measure('decision-time', 'decision-start', 'decision-end');
      
      return ruleBasedDecision;
      
    } catch (error) {
      console.error('Decision making failed:', error);
      
      // Return a safe fallback decision
      const fallbackDecision = this.makeFallbackDecision();
      
      // Record the fallback decision
      this.recordDecision(fallbackDecision, analysisResults, 'fallback');
      
      Performance.mark('decision-end');
      Performance.measure('decision-failed', 'decision-start', 'decision-end');
      
      return fallbackDecision;
    }
  }
  
  /**
   * Make a decision using OpenAI
   * @param {Object} analysisResults - Results from StateAnalyzer
   * @returns {Promise<Object>} - AI-generated decision
   */
  async makeAIDecision(analysisResults) {
    console.log('Making AI-assisted decision...');
    
    // Prepare the orchestration prompt
    const params = {
      currentFractal: analysisResults.fractal.type,
      visualizationParams: JSON.stringify(analysisResults.fractal.parameters),
      audioParams: JSON.stringify(analysisResults.audio.parameters),
      sessionDuration: Math.floor(analysisResults.session.duration / 60), // in minutes
      explorationDepth: analysisResults.exploration.depth,
      interactionFrequency: analysisResults.interactions.frequency.toFixed(2),
      focusAreas: analysisResults.interactions.focusAreas.join(', '),
      navigationPattern: analysisResults.interactions.pattern,
      timeBetweenInteractions: Math.floor(analysisResults.interactions.averageGap),
      recurringInteractions: analysisResults.interactions.recurring.join(', ')
    };
    
    const promptTemplate = PromptTemplates.generateOrchestrationPrompt(params);
    
    // Generate a response from OpenAI
    const response = await this.openai.createCompletion(
      promptTemplate.userMessage,
      { 
        system_message: promptTemplate.systemMessage,
        temperature: 0.7,
        max_tokens: 800
      }
    );
    
    // Parse the response into a decision object
    try {
      const responseText = response.choices[0].message.content;
      const parsedResponse = JSON.parse(responseText);
      
      // Extract and format the decision
      const decision = {
        mode: this.mapMoodToMode(parsedResponse.assessment.attentionState),
        fractal: parsedResponse.recommendations.fractal,
        audio: parsedResponse.recommendations.audio,
        timing: {
          promptTiming: parsedResponse.recommendations.interaction.promptTiming
        },
        ui: {
          prompt: parsedResponse.recommendations.interaction.suggestedPrompt
        },
        rationale: parsedResponse.rationale,
        aiGenerated: true
      };
      
      console.log('AI decision generated:', decision.rationale);
      return decision;
      
    } catch (parseError) {
      console.error('Failed to parse AI decision:', parseError);
      // Fall back to rule-based decision
      return this.makeRuleBasedDecision(analysisResults);
    }
  }
  
  /**
   * Make a decision based on rules
   * @param {Object} analysisResults - Results from StateAnalyzer
   * @returns {Object} - Rule-based decision
   */
  makeRuleBasedDecision(analysisResults) {
    console.log('Making rule-based decision...');
    
    const decision = {
      mode: null,
      fractal: {
        change: false,
        parameters: {}
      },
      audio: {},
      timing: {},
      ui: {},
      rationale: 'Rule-based decision based on current state analysis',
      aiGenerated: false
    };
    
    // Check for user disengagement
    if (analysisResults.session.timeSinceInteraction > this.thresholds.interactionGap) {
      decision.rationale = 'User has been inactive, introducing novelty';
      
      // Suggest a change to maintain interest
      if (Math.random() > 0.5) {
        // Visual change
        decision.fractal.change = true;
        
        if (Math.random() > 0.7) {
          // Change fractal type
          const currentType = analysisResults.fractal.type;
          const types = ['mandelbrot', 'julia', 'burningShip', 'hyperbolic'];
          const availableTypes = types.filter(t => t !== currentType);
          
          decision.fractal.type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        } else {
          // Modify parameters
          const zoom = analysisResults.fractal.parameters.zoom;
          
          // Either zoom in or out
          const zoomFactor = Math.random() > 0.5 ? 1.5 + Math.random() : 0.5 + Math.random() * 0.3;
          decision.fractal.parameters.zoom = zoom * zoomFactor;
          
          // Shift color
          decision.fractal.parameters.colorShift = Math.random();
        }
      } else {
        // Audio change
        const currentTempo = analysisResults.audio.parameters.tempo || 0;
        
        if (currentTempo === 0) {
          // Add rhythm if none
          decision.audio.tempo = 60 + Math.floor(Math.random() * 20);
          decision.audio.pulseRate = 0.25;
        } else {
          // Change tone
          decision.audio.baseFrequency = 300 + Math.random() * 300;
          decision.audio.binauralBeat = 7 + Math.random() * 6;
        }
      }
      
      // Add a UI prompt
      decision.ui.prompt = 'Discovering new patterns...';
    } else {
      // User is actively engaged, make subtle enhancements
      
      // Check if exploration is deep or shallow
      if (analysisResults.exploration.depth === 'deep') {
        // Enhance the experience for deep exploration
        decision.rationale = 'User is deeply exploring, enhancing immersion';
        
        // Subtle audio changes for immersion
        decision.audio.reverbDecay = 2.0 + Math.random();
        
        if (Math.random() > 0.7) {
          // Occasionally introduce harmonic variations
          const harmonicRatios = [...analysisResults.audio.parameters.harmonicRatios];
          const index = Math.floor(Math.random() * harmonicRatios.length);
          harmonicRatios[index] *= 0.95 + Math.random() * 0.1; // Subtle variation
          
          decision.audio.harmonicRatios = harmonicRatios;
        }
      } else {
        // More guidance for shallow exploration
        decision.rationale = 'User is in early exploration, providing guidance';
        
        // Suggest interaction through UI
        if (Math.random() > 0.7) {
          decision.ui.prompt = 'Try zooming in to explore the fractal\'s infinite detail';
          decision.ui.highlight = 'zoom-control';
        }
      }
    }
    
    // Set mode based on engagement pattern
    decision.mode = this.determineModeFromAnalysis(analysisResults);
    
    return decision;
  }
  
  /**
   * Create a safe fallback decision
   * @returns {Object} - Fallback decision
   */
  makeFallbackDecision() {
    return {
      mode: 'contemplative',
      fractal: {
        change: false,
        parameters: {
          colorShift: Math.random() // Just shift colors a bit
        }
      },
      audio: {
        // Gentle, calming sound
        baseFrequency: 432,
        binauralBeat: 7.83
      },
      timing: {},
      ui: {},
      rationale: 'Fallback decision due to decision-making error',
      aiGenerated: false
    };
  }
  
  /**
   * Record a decision for history and analysis
   * @param {Object} decision - The decision made
   * @param {Object} analysisResults - The analysis that led to the decision
   * @param {string} source - Source of the decision (ai, rule, fallback)
   */
  recordDecision(decision, analysisResults, source) {
    this.decisionHistory.push({
      timestamp: Date.now(),
      decision,
      analysisSnapshot: {
        fractalType: analysisResults.fractal.type,
        audioMode: analysisResults.audio.mode,
        interactionPattern: analysisResults.interactions.pattern,
        engagementLevel: analysisResults.engagement.level
      },
      source
    });
    
    // Limit history size
    if (this.decisionHistory.length > 20) {
      this.decisionHistory.shift();
    }
  }
  
  /**
   * Map a mood/state to an experience mode
   * @param {string} mood - Mood or attention state
   * @returns {string} - Mode name
   */
  mapMoodToMode(mood) {
    if (!mood) return null;
    
    const moodLower = mood.toLowerCase();
    
    // Map common moods to modes
    const moodMap = {
      // Contemplative moods
      'contemplative': 'contemplative',
      'reflective': 'contemplative',
      'calm': 'contemplative',
      'meditative': 'contemplative',
      'relaxed': 'contemplative',
      
      // Exploratory moods
      'curious': 'exploratory',
      'engaged': 'exploratory',
      'interested': 'exploratory',
      'exploring': 'exploratory',
      'discovery': 'exploratory',
      
      // Energetic moods
      'energetic': 'energetic',
      'excited': 'energetic',
      'stimulated': 'energetic',
      'aroused': 'energetic',
      'intense': 'energetic',
      
      // Quantum/chaotic moods
      'chaotic': 'quantum',
      'unpredictable': 'quantum',
      'mysterious': 'quantum',
      'confused': 'quantum',
      'distracted': 'quantum',
      
      // Problematic states
      'bored': 'exploratory', // Switch to exploration to engage
      'disengaged': 'energetic' // Switch to energy to reactivate
    };
    
    // Find direct match
    if (moodMap[moodLower]) {
      return moodMap[moodLower];
    }
    
    // Find partial match
    for (const [key, mode] of Object.entries(moodMap)) {
      if (moodLower.includes(key) || key.includes(moodLower)) {
        return mode;
      }
    }
    
    // No match found
    return null;
  }
  
  /**
   * Determine the appropriate mode based on analysis
   * @param {Object} analysisResults - Analysis results
   * @returns {string|null} - Recommended mode or null if no change needed
   */
  determineModeFromAnalysis(analysisResults) {
    // Base on engagement level
    const engagement = analysisResults.engagement.level;
    const interactionPattern = analysisResults.interactions.pattern;
    
    if (engagement < 0.3) {
      // Low engagement - energize
      return 'energetic';
    } else if (engagement > 0.8) {
      // High engagement - deepen experience
      return interactionPattern === 'exploratory' ? 'exploratory' : 'contemplative';
    } else if (interactionPattern === 'erratic') {
      // Erratic behavior - calm down
      return 'contemplative';
    } else if (interactionPattern === 'repetitive' && Math.random() > 0.7) {
      // Sometimes introduce quantum effects for repetitive patterns
      return 'quantum';
    }
    
    // No mode change needed
    return null;
  }
  
  /**
   * Get decision history
   * @returns {Array} - History of decisions
   */
  getDecisionHistory() {
    return [...this.decisionHistory];
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    // Nothing to dispose currently
    this.decisionHistory = [];
  }
}

export default DecisionEngine;