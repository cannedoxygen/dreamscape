/**
 * StateAnalyzer.js
 * 
 * Analyzes the current state of the system, tracks user behavior patterns,
 * and provides insights for the DecisionEngine to make informed decisions.
 */

import { Performance } from '../utils/Performance';

export class StateAnalyzer {
  /**
   * Initialize the StateAnalyzer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    
    // State tracking
    this.currentState = {
      fractal: {
        type: null,
        parameters: {},
        performanceMetrics: {}
      },
      audio: {
        parameters: {},
        analysis: {}
      },
      interaction: {
        patterns: {},
        recentInteractions: [],
        hotspots: []
      },
      engagement: {
        level: 0.5, // 0-1 scale
        trend: 'stable', // 'increasing', 'decreasing', 'stable'
        attention: 'focused' // 'focused', 'distracted', 'passive'
      }
    };
    
    // Temporal tracking
    this.stateHistory = [];
    this.interactionHistory = [];
    this.analysisResults = [];
    
    // Configurable thresholds
    this.thresholds = {
      idleTime: this.config.idleTime || 60, // seconds
      highEngagement: this.config.highEngagement || 0.7,
      lowEngagement: this.config.lowEngagement || 0.3,
      interactionFrequency: this.config.interactionFrequency || 10 // interactions per minute
    };
    
    // Analysis settings
    this.analysisFrequency = this.config.analysisFrequency || 10000; // ms
    this.historyLimit = this.config.historyLimit || 100; // Max entries to keep
    this.analysisPeriod = this.config.analysisPeriod || 300; // seconds to analyze
    
    // Stateful values
    this.lastAnalysisTime = Date.now();
    this.lastInteractionTime = Date.now();
  }
  
  /**
   * Initialize the analyzer
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    console.log('Initializing StateAnalyzer...');
    return Promise.resolve();
  }
  
  /**
   * Update fractal state
   * @param {Object} state - Fractal state data
   */
  updateFractalState(state) {
    this.currentState.fractal = {
      ...this.currentState.fractal,
      ...state
    };
  }
  
  /**
   * Update audio state
   * @param {Object} state - Audio state data
   */
  updateAudioState(state) {
    this.currentState.audio = {
      ...this.currentState.audio,
      ...state
    };
  }
  
  /**
   * Update interaction state
   * @param {Object} interaction - Interaction data
   */
  updateInteractionState(interaction) {
    // Add to recent interactions
    this.currentState.interaction.recentInteractions.push({
      ...interaction,
      timestamp: Date.now()
    });
    
    // Limit size of recent interactions
    if (this.currentState.interaction.recentInteractions.length > 20) {
      this.currentState.interaction.recentInteractions.shift();
    }
    
    // Add to interaction history
    this.interactionHistory.push({
      ...interaction,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.interactionHistory.length > this.historyLimit) {
      this.interactionHistory.shift();
    }
    
    // Update last interaction time
    this.lastInteractionTime = Date.now();
    
    // Update patterns based on this interaction
    this.updateInteractionPatterns(interaction);
  }
  
  /**
   * Update interaction patterns based on a new interaction
   * @param {Object} interaction - The new interaction
   */
  updateInteractionPatterns(interaction) {
    const patterns = this.currentState.interaction.patterns;
    
    // Frequency tracking by type
    if (!patterns.frequency) {
      patterns.frequency = {};
    }
    
    if (!patterns.frequency[interaction.type]) {
      patterns.frequency[interaction.type] = 1;
    } else {
      patterns.frequency[interaction.type]++;
    }
    
    // Track spatial patterns for pointer/touch interactions
    if (interaction.position) {
      if (!patterns.spatial) {
        patterns.spatial = {
          quadrants: [0, 0, 0, 0], // TOP-LEFT, TOP-RIGHT, BOTTOM-LEFT, BOTTOM-RIGHT
          edges: [0, 0, 0, 0], // TOP, RIGHT, BOTTOM, LEFT
          center: 0
        };
      }
      
      const { x, y } = interaction.position;
      
      // Determine quadrant
      const quadrant = (y < 0.5 ? 0 : 2) + (x < 0.5 ? 0 : 1);
      patterns.spatial.quadrants[quadrant]++;
      
      // Determine if edge interaction
      const edgeThreshold = 0.1;
      if (y < edgeThreshold) patterns.spatial.edges[0]++; // TOP
      if (x > 1 - edgeThreshold) patterns.spatial.edges[1]++; // RIGHT
      if (y > 1 - edgeThreshold) patterns.spatial.edges[2]++; // BOTTOM
      if (x < edgeThreshold) patterns.spatial.edges[3]++; // LEFT
      
      // Determine if center interaction
      const centerThreshold = 0.3;
      if (Math.abs(x - 0.5) < centerThreshold && Math.abs(y - 0.5) < centerThreshold) {
        patterns.spatial.center++;
      }
      
      // Update hotspots
      this.updateHotspots(x, y);
    }
    
    // Track temporal patterns
    if (!patterns.temporal) {
      patterns.temporal = {
        intervalSum: 0,
        intervalCount: 0,
        averageInterval: 0,
        burstCount: 0
      };
    }
    
    const now = Date.now();
    const recentInteractions = this.currentState.interaction.recentInteractions;
    
    if (recentInteractions.length > 1) {
      const prevTimestamp = recentInteractions[recentInteractions.length - 2].timestamp;
      const interval = now - prevTimestamp;
      
      patterns.temporal.intervalSum += interval;
      patterns.temporal.intervalCount++;
      patterns.temporal.averageInterval = patterns.temporal.intervalSum / patterns.temporal.intervalCount;
      
      // Check for bursts (rapid sequences of interactions)
      if (interval < 500) { // Less than 500ms between interactions
        patterns.temporal.burstCount++;
      }
    }
  }
  
  /**
   * Update interaction hotspots
   * @param {number} x - Normalized X coordinate (0-1)
   * @param {number} y - Normalized Y coordinate (0-1)
   */
  updateHotspots(x, y) {
    const hotspots = this.currentState.interaction.hotspots;
    const radius = 0.1; // Hotspot radius in normalized coordinates
    
    // Check if this interaction is within an existing hotspot
    let foundHotspot = false;
    
    for (const hotspot of hotspots) {
      const distance = Math.sqrt(Math.pow(x - hotspot.x, 2) + Math.pow(y - hotspot.y, 2));
      
      if (distance < radius) {
        // Update existing hotspot
        hotspot.count++;
        hotspot.lastUpdated = Date.now();
        
        // Update position (weighted average)
        const weight = 0.8; // Weight of previous position
        hotspot.x = weight * hotspot.x + (1 - weight) * x;
        hotspot.y = weight * hotspot.y + (1 - weight) * y;
        
        foundHotspot = true;
        break;
      }
    }
    
    // Create new hotspot if none found
    if (!foundHotspot) {
      hotspots.push({
        x,
        y,
        count: 1,
        created: Date.now(),
        lastUpdated: Date.now()
      });
    }
    
    // Limit number of hotspots
    if (hotspots.length > 5) {
      // Remove oldest or least active hotspot
      const now = Date.now();
      const oldestThreshold = now - 60000; // 1 minute
      
      // First try to remove old inactive hotspots
      const oldIndex = hotspots.findIndex(h => h.lastUpdated < oldestThreshold && h.count < 3);
      
      if (oldIndex >= 0) {
        hotspots.splice(oldIndex, 1);
      } else {
        // Otherwise remove the least active
        let minCount = Infinity;
        let minIndex = 0;
        
        hotspots.forEach((h, index) => {
          if (h.count < minCount) {
            minCount = h.count;
            minIndex = index;
          }
        });
        
        hotspots.splice(minIndex, 1);
      }
    }
  }
  
  /**
   * Analyze current system state
   * @param {Object} systemState - Complete system state
   * @returns {Object} - Analysis results
   */
  async analyze(systemState) {
    Performance.mark('state-analysis-start');
    
    // Record current time
    const now = Date.now();
    
    // Add to state history
    this.stateHistory.push({
      timestamp: now,
      state: JSON.parse(JSON.stringify(systemState))
    });
    
    // Limit history size
    if (this.stateHistory.length > this.historyLimit) {
      this.stateHistory.shift();
    }
    
    // Get analysis time window
    const analysisPeriod = this.analysisPeriod * 1000; // convert to ms
    const startTime = now - analysisPeriod;
    
    // Filter history to analysis period
    const recentHistory = this.stateHistory.filter(entry => entry.timestamp >= startTime);
    const recentInteractions = this.interactionHistory.filter(entry => entry.timestamp >= startTime);
    
    // Basic metrics
    const metrics = {
      timeElapsed: (now - this.lastAnalysisTime) / 1000, // seconds
      timeSinceLastInteraction: (now - this.lastInteractionTime) / 1000, // seconds
      interactionCount: recentInteractions.length,
      interactionFrequency: recentInteractions.length / (analysisPeriod / 60000), // per minute
      stateChangeCount: recentHistory.length
    };
    
    // Analyze engagement
    const engagement = this.analyzeEngagement(metrics, recentInteractions, systemState);
    
    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(recentInteractions);
    
    // Analyze audio-visual relationship
    const audioVisualRelationship = this.analyzeAudioVisualRelationship(systemState);
    
    // Detect any concerning issues
    const issues = this.detectIssues(systemState, metrics, engagement);
    
    // Create analysis result
    const analysis = {
      timestamp: now,
      metrics,
      engagement,
      interactionPatterns,
      audioVisualRelationship,
      issues,
      recommendations: []
    };
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis, systemState);
    
    // Add to analysis results history
    this.analysisResults.push(analysis);
    
    // Limit history size
    if (this.analysisResults.length > this.historyLimit) {
      this.analysisResults.shift();
    }
    
    // Update last analysis time
    this.lastAnalysisTime = now;
    
    Performance.mark('state-analysis-end');
    Performance.measure('state-analysis', 'state-analysis-start', 'state-analysis-end');
    
    return analysis;
  }
  
  /**
   * Analyze user engagement
   * @param {Object} metrics - Basic metrics
   * @param {Array} recentInteractions - Recent user interactions
   * @param {Object} systemState - Current system state
   * @returns {Object} - Engagement analysis
   */
  analyzeEngagement(metrics, recentInteractions, systemState) {
    // Calculate engagement level based on interaction frequency and recency
    let engagementLevel = 0;
    
    // Factor 1: Time since last interaction (more recent = higher engagement)
    const recencyFactor = Math.max(0, 1 - (metrics.timeSinceLastInteraction / this.thresholds.idleTime));
    
    // Factor 2: Interaction frequency compared to threshold
    const frequencyFactor = Math.min(1, metrics.interactionFrequency / this.thresholds.interactionFrequency);
    
    // Factor 3: Interaction complexity (types of interactions)
    const interactionTypes = new Set(recentInteractions.map(i => i.type));
    const complexityFactor = Math.min(1, interactionTypes.size / 5); // Normalize to 0-1
    
    // Combine factors with weights
    engagementLevel = recencyFactor * 0.5 + frequencyFactor * 0.3 + complexityFactor * 0.2;
    
    // Determine trend by comparing to previous analysis
    let trend = 'stable';
    if (this.analysisResults.length > 0) {
      const prevEngagement = this.analysisResults[this.analysisResults.length - 1].engagement.level;
      const delta = engagementLevel - prevEngagement;
      
      if (delta > 0.1) {
        trend = 'increasing';
      } else if (delta < -0.1) {
        trend = 'decreasing';
      }
    }
    
    // Determine attention state
    let attention = 'focused';
    if (metrics.timeSinceLastInteraction > this.thresholds.idleTime) {
      attention = 'passive';
    } else if (metrics.interactionFrequency > this.thresholds.interactionFrequency * 2) {
      // Very high interaction frequency might indicate distraction/random clicking
      attention = 'distracted';
    }
    
    // Update current state
    this.currentState.engagement = {
      level: engagementLevel,
      trend,
      attention
    };
    
    return {
      level: engagementLevel,
      trend,
      attention,
      factors: {
        recency: recencyFactor,
        frequency: frequencyFactor,
        complexity: complexityFactor
      }
    };
  }
  
  /**
   * Analyze interaction patterns
   * @param {Array} recentInteractions - Recent user interactions
   * @returns {Object} - Interaction pattern analysis
   */
  analyzeInteractionPatterns(recentInteractions) {
    if (recentInteractions.length < 2) {
      return {
        pattern: 'insufficient_data',
        rhythmic: false,
        explorative: false,
        focused: false,
        chaotic: false
      };
    }
    
    // Calculate intervals between interactions
    const intervals = [];
    for (let i = 1; i < recentInteractions.length; i++) {
      intervals.push(recentInteractions[i].timestamp - recentInteractions[i - 1].timestamp);
    }
    
    // Calculate interval statistics
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate coefficient of variation (normalized standard deviation)
    const cv = stdDev / avgInterval;
    
    // Determine if interactions are rhythmic (low variance in intervals)
    const rhythmic = cv < 0.3;
    
    // Determine if interactions are explorative (varied types and positions)
    const types = new Set(recentInteractions.map(i => i.type));
    const explorative = types.size > 2;
    
    // Determine if interactions are focused (clustered in time and space)
    const timeWindow = 10000; // 10 seconds
    let maxClusterSize = 0;
    
    for (let i = 0; i < recentInteractions.length; i++) {
      let clusterSize = 1;
      const baseTime = recentInteractions[i].timestamp;
      
      for (let j = i + 1; j < recentInteractions.length; j++) {
        if (recentInteractions[j].timestamp - baseTime < timeWindow) {
          clusterSize++;
        } else {
          break;
        }
      }
      
      maxClusterSize = Math.max(maxClusterSize, clusterSize);
    }
    
    const focused = maxClusterSize > recentInteractions.length * 0.7;
    
    // Determine if interactions are chaotic (high variance, many types, no clear pattern)
    const chaotic = cv > 0.8 && types.size > 3;
    
    // Determine dominant pattern
    let pattern = 'mixed';
    
    if (rhythmic && focused) {
      pattern = 'deliberate';
    } else if (rhythmic && !focused) {
      pattern = 'scanning';
    } else if (explorative && !rhythmic) {
      pattern = 'explorative';
    } else if (focused && !rhythmic) {
      pattern = 'focused';
    } else if (chaotic) {
      pattern = 'chaotic';
    } else if (recentInteractions.length < 5) {
      pattern = 'minimal';
    }
    
    return {
      pattern,
      rhythmic,
      explorative,
      focused,
      chaotic,
      intervalStats: {
        average: avgInterval,
        stdDev,
        cv
      }
    };
  }
  
  /**
   * Analyze relationship between audio and visual elements
   * @param {Object} systemState - Current system state
   * @returns {Object} - Audio-visual relationship analysis
   */
  analyzeAudioVisualRelationship(systemState) {
    // Extract audio and visual parameters
    const audio = systemState.audio;
    const fractal = systemState.fractal;
    
    if (!audio || !fractal) {
      return {
        coherence: 'unknown',
        intensity: 0.5,
        complementary: true
      };
    }
    
    // Calculate audio intensity
    let audioIntensity = 0.5;
    if (audio.parameters) {
      const { tempo, volume, baseFrequency } = audio.parameters;
      
      // Normalize values
      const normalizedTempo = tempo ? tempo / 120 : 0; // Normalized to 120 BPM
      const normalizedVolume = volume || 0.5;
      const normalizedFrequency = baseFrequency ? (baseFrequency - 200) / 600 : 0.5; // Normalize to 200-800 Hz range
      
      audioIntensity = (normalizedTempo * 0.4 + normalizedVolume * 0.4 + normalizedFrequency * 0.2);
    }
    
    // Calculate visual intensity
    let visualIntensity = 0.5;
    if (fractal.parameters) {
      const { iterations, zoom, colorShift, rotationAngle } = fractal.parameters;
      
      // Normalize values
      const normalizedIterations = iterations ? iterations / 200 : 0.5; // Normalized to 200 iterations
      const normalizedZoom = zoom ? Math.min(1, 1 / zoom) : 0.5; // Inverse relationship
      const normalizedRotation = rotationAngle ? Math.min(1, Math.abs(rotationAngle) / Math.PI) : 0;
      
      visualIntensity = (normalizedIterations * 0.3 + normalizedZoom * 0.4 + normalizedRotation * 0.3);
    }
    
    // Calculate coherence (how well matched audio and visual intensities are)
    const intensityDifference = Math.abs(audioIntensity - visualIntensity);
    
    let coherence;
    if (intensityDifference < 0.2) {
      coherence = 'high';
    } else if (intensityDifference < 0.4) {
      coherence = 'medium';
    } else {
      coherence = 'low';
    }
    
    // Determine if audio and visual are complementary
    // They can be different but still work well together (e.g., calm visuals with rhythmic audio)
    let complementary = true;
    
    // Check for combinations that might not work well
    if (audioIntensity > 0.7 && visualIntensity < 0.3) {
      // Energetic audio with very calm visuals
      complementary = false;
    } else if (audioIntensity < 0.3 && visualIntensity > 0.7) {
      // Calm audio with very intense visuals
      complementary = false;
    }
    
    return {
      coherence,
      audioIntensity,
      visualIntensity,
      intensityDifference,
      complementary
    };
  }
  
  /**
   * Detect any issues in the current state
   * @param {Object} systemState - Current system state
   * @param {Object} metrics - Analysis metrics
   * @param {Object} engagement - Engagement analysis
   * @returns {Array} - Detected issues
   */
  detectIssues(systemState, metrics, engagement) {
    const issues = [];
    
    // Check for prolonged inactivity
    if (metrics.timeSinceLastInteraction > this.thresholds.idleTime * 2) {
      issues.push({
        type: 'inactivity',
        severity: 'medium',
        message: 'User has been inactive for an extended period',
        value: metrics.timeSinceLastInteraction
      });
    }
    
    // Check for low engagement
    if (engagement.level < this.thresholds.lowEngagement && engagement.trend === 'decreasing') {
      issues.push({
        type: 'low_engagement',
        severity: 'high',
        message: 'User engagement is low and decreasing',
        value: engagement.level
      });
    }
    
    // Check for performance issues
    if (systemState.fractal && systemState.fractal.performance) {
      const fps = systemState.fractal.performance.fps;
      if (fps && fps < 30) {
        issues.push({
          type: 'performance',
          severity: fps < 20 ? 'high' : 'medium',
          message: 'Fractal rendering performance is low',
          value: fps
        });
      }
    }
    
    // Check for audio-visual dissonance
    const avRelationship = this.analyzeAudioVisualRelationship(systemState);
    if (avRelationship.coherence === 'low' && !avRelationship.complementary) {
      issues.push({
        type: 'audiovisual_dissonance',
        severity: 'medium',
        message: 'Audio and visuals lack coherence',
        value: avRelationship.intensityDifference
      });
    }
    
    // Check for erratic interaction patterns
    if (metrics.interactionCount > 10) {
      const patterns = this.analyzeInteractionPatterns(
        this.interactionHistory.slice(-Math.min(20, this.interactionHistory.length))
      );
      
      if (patterns.chaotic) {
        issues.push({
          type: 'erratic_interactions',
          severity: 'low',
          message: 'User interaction pattern appears erratic or random',
          value: patterns.intervalStats.cv
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - Analysis results
   * @param {Object} systemState - Current system state
   * @returns {Array} - Recommendations
   */
  generateRecommendations(analysis, systemState) {
    const recommendations = [];
    
    // Check for issues first
    for (const issue of analysis.issues) {
      switch (issue.type) {
        case 'inactivity':
          recommendations.push({
            type: 'mode_change',
            priority: 'high',
            description: 'Switch to a more engaging mode to recapture attention',
            parameters: {
              mode: 'energetic'
            }
          });
          break;
          
        case 'low_engagement':
          recommendations.push({
            type: 'introduce_novelty',
            priority: 'high',
            description: 'Introduce a new fractal type or significant parameter change',
            parameters: {
              fractalChange: true,
              audioChange: true
            }
          });
          break;
          
        case 'performance':
          recommendations.push({
            type: 'optimize_performance',
            priority: 'high',
            description: 'Reduce rendering complexity to improve performance',
            parameters: {
              reducedIterations: true,
              simplifyEffects: true
            }
          });
          break;
          
        case 'audiovisual_dissonance':
          recommendations.push({
            type: 'harmonize_av',
            priority: 'medium',
            description: 'Adjust audio or visuals to create better coherence',
            parameters: {
              matchIntensities: true
            }
          });
          break;
      }
    }
    
    // Engagement-based recommendations
    if (analysis.engagement.level < this.thresholds.lowEngagement) {
      // Low engagement recommendations
      if (analysis.engagement.trend === 'decreasing') {
        recommendations.push({
          type: 'increase_interactivity',
          priority: 'medium',
          description: 'Increase interactive elements or responsiveness',
          parameters: {
            audioReactivity: true,
            pulseEffects: true
          }
        });
      }
    } else if (analysis.engagement.level > this.thresholds.highEngagement) {
      // High engagement recommendations - don't disturb too much
      recommendations.push({
        type: 'subtle_evolution',
        priority: 'low',
        description: 'Continue current experience with subtle variations',
        parameters: {
          gradualChange: true
        }
      });
    }
    
    // Pattern-based recommendations
    if (analysis.interactionPatterns.pattern === 'explorative') {
      recommendations.push({
        type: 'encourage_exploration',
        priority: 'medium',
        description: 'Provide more variety and discovery opportunities',
        parameters: {
          increaseRandomness: true,
          newElements: true
        }
      });
    } else if (analysis.interactionPatterns.pattern === 'focused') {
      recommendations.push({
        type: 'deepen_experience',
        priority: 'medium',
        description: 'Provide more depth in the current area of focus',
        parameters: {
          increaseDetail: true,
          relatedContent: true
        }
      });
    }
    
    // Add variety if recommendations are empty
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintain_interest',
        priority: 'low',
        description: 'Introduce a small change to maintain interest',
        parameters: {
          smallVariation: true
        }
      });
    }
    
    return recommendations;
  }
  
  /**
   * Get the latest analysis results
   * @returns {Object|null} - Latest analysis or null if none available
   */
  getLatestAnalysis() {
    if (this.analysisResults.length === 0) return null;
    return this.analysisResults[this.analysisResults.length - 1];
  }
  
  /**
   * Get a summary of the current state
   * @returns {Object} - State summary
   */
  getStateSummary() {
    return {
      currentState: this.currentState,
      metrics: {
        stateHistorySize: this.stateHistory.length,
        interactionHistorySize: this.interactionHistory.length,
        analysisResultsSize: this.analysisResults.length,
        timeSinceLastAnalysis: (Date.now() - this.lastAnalysisTime) / 1000,
        timeSinceLastInteraction: (Date.now() - this.lastInteractionTime) / 1000
      }
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Clear histories
    this.stateHistory = [];
    this.interactionHistory = [];
    this.analysisResults = [];
    
    console.log('StateAnalyzer disposed');
  }
}

export default StateAnalyzer;