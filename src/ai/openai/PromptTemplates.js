/**
 * PromptTemplates.js
 * 
 * Collection of templates for generating prompts to the OpenAI API.
 * These templates ensure consistent structure and formatting for different types
 * of requests, improving response quality and consistency.
 */

import { SystemPrompts } from '../../config/ApiConfig';

/**
 * Replace placeholder variables in a template string
 * 
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} variables - Object containing variable values
 * @returns {string} - Processed template with variables replaced
 */
function processTemplate(template, variables = {}) {
  return template.replace(/\{([^{}]+)\}/g, (match, variable) => {
    return variables[variable] !== undefined ? variables[variable] : match;
  });
}

export const PromptTemplates = {
  /**
   * Generates a fractal visualization prompt
   * 
   * @param {Object} params - Parameters for the fractal
   * @returns {Object} - Formatted prompt object
   */
  generateFractalPrompt(params = {}) {
    const systemPrompt = SystemPrompts.FRACTAL_SYSTEM_MESSAGE;
    
    const template = `
Generate parameters for a beautiful fractal visualization with the following characteristics:

- Base fractal type: {fractalType}
- Emotional tone: {emotionalTone}
- Visual complexity: {complexity} (1-10 scale)
- Key colors or palette inspiration: {colorDescription}

Please generate a JSON object with the following structure:
{
  "fractalType": "string", // e.g., "mandelbrot", "julia", "mandelbulb", "custom"
  "parameters": {
    // Core mathematical parameters
    "equation": "string", // The mathematical formula, e.g., "z^2 + c"
    "centerX": number, // Center X coordinate
    "centerY": number, // Center Y coordinate
    "zoom": number, // Zoom level
    "iterations": number, // Iteration depth
    "exponent": number, // Power/exponent in the formula
    "bailout": number, // Escape radius
    "juliaReal": number, // For Julia sets, real component
    "juliaImag": number, // For Julia sets, imaginary component
  },
  "visualization": {
    "colorPalette": [
      // Array of hex colors
    ],
    "colorMode": "string", // e.g., "smooth", "bands", "histogram"
    "colorCycles": number, // How many times colors cycle through the palette
    "glowIntensity": number, // 0-1 scale
    "rotationSpeed": number, // Degrees per second
    "orbitTraps": boolean, // Whether to use orbit traps
  },
  "description": "string" // A short, poetic description of what this fractal evokes
}

Return only the JSON object with no additional text.`;
    
    return {
      systemMessage: systemPrompt,
      userMessage: processTemplate(template, params)
    };
  },
  
  /**
   * Generates a harmonic sound environment prompt
   * 
   * @param {Object} params - Parameters for the sound
   * @returns {Object} - Formatted prompt object
   */
  generateSoundPrompt(params = {}) {
    const systemPrompt = SystemPrompts.SOUND_SYSTEM_MESSAGE;
    
    const template = `
Create a mathematical sound environment to complement a fractal visualization with these characteristics:

- Fractal type: {fractalType}
- Emotional tone: {emotionalTone}
- Sound complexity: {complexity} (1-10 scale)
- Rhythm style: {rhythmStyle}
- Current depth of exploration: {explorationDepth} (shallow/medium/deep)

Please generate a JSON object with the following structure:
{
  "baseFrequency": number, // Fundamental frequency in Hz
  "harmonicRatios": [
    // Array of ratios that form the harmonic series
  ],
  "binauralBeat": {
    "enabled": boolean,
    "frequency": number, // Frequency difference between ears in Hz
    "carrier": number // Base carrier wave frequency
  },
  "oscillators": [
    {
      "type": "string", // e.g., "sine", "triangle", "sawtooth", "custom"
      "frequency": "string", // Can be an equation based on baseFrequency
      "amplitude": number, // 0-1 scale
      "modulation": {
        "type": "string", // e.g., "AM", "FM", "none"
        "rate": number,
        "depth": number
      }
    }
    // Multiple oscillator definitions
  ],
  "rhythm": {
    "bpm": number,
    "patternLength": number, // In beats
    "pulses": number, // Number of active beats in the pattern
    "accents": [
      // Array of accent positions
    ]
  },
  "effects": {
    "reverb": {
      "enabled": boolean,
      "decay": number,
      "wet": number // 0-1 scale
    },
    "delay": {
      "enabled": boolean,
      "time": number, // In milliseconds
      "feedback": number, // 0-1 scale
      "wet": number // 0-1 scale
    },
    "filter": {
      "type": "string", // e.g., "lowpass", "highpass", "bandpass"
      "frequency": number,
      "resonance": number
    }
  },
  "description": "string" // A short description of the sound environment
}

Return only the JSON object with no additional text.`;
    
    return {
      systemMessage: systemPrompt,
      userMessage: processTemplate(template, params)
    };
  },
  
  /**
   * Generates a mood-to-parameters mapping prompt
   * 
   * @param {Object} params - Parameters for the mood mapping
   * @returns {Object} - Formatted prompt object
   */
  generateMoodMappingPrompt(params = {}) {
    const systemPrompt = SystemPrompts.MOOD_SYSTEM_MESSAGE;
    
    const template = `
Translate the following emotional/cognitive experience into mathematical and aesthetic parameters:

- Primary emotion: {primaryEmotion}
- Secondary emotion: {secondaryEmotion}
- Intensity: {intensity} (1-10 scale)
- Cognitive state: {cognitiveState} (e.g., focused, contemplative, analytical, dreamy)
- Movement style: {movementStyle} (e.g., flowing, pulsing, spiraling, expanding)

Please generate a JSON object with these sections:
{
  "fractal": {
    "recommendedType": "string", // e.g., "julia", "mandelbrot"
    "parameters": {
      // Core mathematical parameters that evoke this mood
      "complexity": number, // 1-10 scale
      "symmetry": number, // 1-10 scale
      "chaos": number, // 1-10 scale
      "expansion": number // 1-10 scale
    }
  },
  "visual": {
    "colorPalette": [
      // Array of hex colors that evoke this mood
    ],
    "luminosity": number, // 0-1 scale
    "contrast": number, // 0-1 scale
    "movement": {
      "speed": number, // 0-1 scale
      "pattern": "string", // e.g., "pulse", "wave", "spiral"
      "direction": "string" // e.g., "inward", "outward", "circular"
    }
  },
  "audio": {
    "tonality": "string", // e.g., "major", "minor", "atonal"
    "keyFrequency": number, // Base frequency in Hz
    "tempo": number, // BPM
    "rhythm": {
      "regularity": number, // 0-1 scale (chaotic to regular)
      "complexity": number // 1-10 scale
    },
    "texture": {
      "density": number, // 0-1 scale
      "roughness": number, // 0-1 scale
      "brightness": number // 0-1 scale
    }
  },
  "interactive": {
    "responsiveness": number, // 0-1 scale
    "unpredictability": number, // 0-1 scale
    "guidanceLevel": number, // 0-1 scale (free exploration vs guided)
    "pacingStyle": "string" // e.g., "gradual", "pulsed", "flowing"
  },
  "description": "string" // A poetic description of this emotional-mathematical mapping
}

Return only the JSON object with no additional text.`;
    
    return {
      systemMessage: systemPrompt,
      userMessage: processTemplate(template, params)
    };
  },
  
  /**
   * Generates a natural language input processing prompt
   * 
   * @param {Object} params - User input and context
   * @returns {Object} - Formatted prompt object
   */
  processNaturalLanguageInput(params = {}) {
    const systemPrompt = `You are an AI assistant that helps translate natural language descriptions 
into specific parameters for a mathematical dreamscape experience. Users will describe what they 
want to experience, and you'll extract their intent into structured parameters.`;
    
    const template = `
Analyze this user request and extract parameters for our mathematical dreamscape:

USER REQUEST:
"{userInput}"

CURRENT STATE:
- Current fractal: {currentFractal}
- Current mood: {currentMood}
- Exploration depth: {explorationDepth}

Extract the user's intent and translate it into structured parameters. Return a JSON object with these sections:
{
  "intent": {
    "primary": "string", // The main thing the user wants (e.g., "change_fractal", "adjust_mood", "modify_sound", "explore_deeper")
    "secondary": "string", // Secondary intent if present
    "intensity": number // How strongly they want this change (1-10)
  },
  "parameters": {
    "fractal": {
      "type": "string", // If they specified a fractal type
      "complexity": number, // 1-10 if mentioned
      "colorScheme": "string" // If they mentioned colors
    },
    "mood": {
      "primary": "string", // Primary emotional tone
      "secondary": "string" // Secondary emotional tone
    },
    "sound": {
      "style": "string", // Sound style if mentioned
      "intensity": number, // 1-10 if mentioned
      "tempo": "string" // e.g., "fast", "slow", "moderate"
    },
    "exploration": {
      "direction": "string", // e.g., "deeper", "broader", "different"
      "focus": "string" // Specific aspect to focus on
    }
  },
  "interpretation": "string" // A short description of how you understood their request
}

Return only the JSON object with no additional text.`;
    
    return {
      systemMessage: systemPrompt,
      userMessage: processTemplate(template, params)
    };
  },
  
  /**
   * Generates a system orchestration prompt
   * 
   * @param {Object} params - System state and analytics
   * @returns {Object} - Formatted prompt object
   */
  generateOrchestrationPrompt(params = {}) {
    const systemPrompt = `You are an AI orchestrator that helps create cohesive, 
engaging mathematical experiences by analyzing user behavior and system state.`;
    
    const template = `
Analyze the current system state and user interaction patterns to recommend adaptations:

SYSTEM STATE:
- Current fractal: {currentFractal}
- Current visualization parameters: {visualizationParams}
- Current audio environment: {audioParams}
- Session duration: {sessionDuration} minutes
- Exploration depth: {explorationDepth}

USER INTERACTION PATTERNS:
- Interaction frequency: {interactionFrequency} actions per minute
- Focus areas: {focusAreas}
- Navigation pattern: {navigationPattern}
- Average time between interactions: {timeBetweenInteractions} seconds
- Recurring interactions: {recurringInteractions}

Based on this analysis, recommend adaptive changes to maintain engagement and create a cohesive experience.
Return a JSON object with these sections:
{
  "assessment": {
    "engagementLevel": number, // 1-10 scale
    "explorationPattern": "string", // e.g., "deep_focus", "broad_exploration", "repetitive", "erratic"
    "attentionState": "string", // e.g., "engaged", "distracted", "contemplative", "bored"
    "likelyGoal": "string" // What the user seems to be trying to achieve
  },
  "recommendations": {
    "fractal": {
      "change": boolean, // Whether to change the fractal
      "type": "string", // Recommended type if change is true
      "parameters": {
        // Specific parameter adjustments
      }
    },
    "visualization": {
      "colorShift": number, // -1 to 1 scale (negative: cool colors, positive: warm colors)
      "complexityShift": number, // -1 to 1 scale (negative: simplify, positive: complexify)
      "movementAdjustment": "string" // e.g., "faster", "slower", "more_cyclic", "more_random"
    },
    "audio": {
      "energyShift": number, // -1 to 1 scale
      "tonicityChange": "string", // e.g., "maintain", "shift_up", "shift_down", "introduce_discord"
      "rhythmAdjustment": "string" // e.g., "maintain", "intensify", "relax", "syncopate"
    },
    "interaction": {
      "promptTiming": "string", // When to introduce a prompt or change, e.g., "immediate", "after_30s", "next_interaction"
      "suggestedPrompt": "string", // Text to show user if appropriate
      "unpredictabilityLevel": number // 0-1 scale, how much randomness to introduce
    }
  },
  "rationale": "string" // Brief explanation of your recommendations
}

Return only the JSON object with no additional text.`;
    
    return {
      systemMessage: systemPrompt,
      userMessage: processTemplate(template, params)
    };
  }
};

export default PromptTemplates;