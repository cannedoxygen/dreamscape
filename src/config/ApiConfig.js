/**
 * ApiConfig.js
 * 
 * Configuration settings for all API services used in the application.
 * Centralizes API keys, endpoints, and usage parameters.
 */

// Load environment variables
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// OpenAI API configuration
export const ApiConfig = {
  // API Keys - should be set in environment variables in production
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // API endpoints
  OPENAI_API_BASE_URL: 'https://api.openai.com/v1',
  
  // Models to use for different tasks
  MODELS: {
    // Text completion models
    FRACTAL_GENERATION: 'gpt-4-turbo',
    SOUND_COMPOSITION: 'gpt-4-turbo',
    MOOD_MAPPING: 'gpt-4-turbo',
    SYSTEM_ORCHESTRATION: 'gpt-3.5-turbo',
    
    // Image generation
    IMAGE_GENERATION: 'dall-e-3'
  },
  
  // Request parameters
  PARAMETERS: {
    // Default parameters for creative tasks
    CREATIVE: {
      temperature: 0.8,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.2
    },
    
    // Parameters for more precise, technical outputs
    TECHNICAL: {
      temperature: 0.4,
      max_tokens: 800,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    },
    
    // Parameters for system-level operations
    SYSTEM: {
      temperature: 0.2,
      max_tokens: 300,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }
  },
  
  // Usage limits and throttling
  USAGE: {
    MAX_TOKENS_PER_DAY: 100000,
    MAX_REQUESTS_PER_MINUTE: 20,
    RATE_LIMIT_INTERVAL: 60000, // 1 minute in milliseconds
    WARNING_THRESHOLD: 0.8 // Warn when 80% of token budget is used
  },
  
  // Caching configuration
  ENABLE_CACHE: true,
  CACHE_TTL: 3600000, // 1 hour in milliseconds
  CACHE_MAX_SIZE: 100, // Maximum number of cached responses
  
  // Fallback configuration for offline mode or when API limits are reached
  FALLBACK: {
    USE_SIMULATED_RESPONSES: ENVIRONMENT === 'development',
    PREGENERATED_RESPONSES_PATH: '/assets/ai-responses/'
  },
  
  // Debug/Development settings
  DEBUG: {
    LOG_REQUESTS: ENVIRONMENT === 'development',
    LOG_RESPONSES: ENVIRONMENT === 'development',
    LOG_ERRORS: true,
    MEASURE_LATENCY: true
  }
};

// Custom prompts and system messages
export const SystemPrompts = {
  // Base system message for fractal generation
  FRACTAL_SYSTEM_MESSAGE: `You are an AI that specializes in creating beautiful mathematical fractal experiences. 
Your task is to generate parameters for fractal visualization and sound that create a cohesive, immersive experience.
Always return your response in valid JSON format that can be parsed by the system.`,

  // System message for sound generation
  SOUND_SYSTEM_MESSAGE: `You are an AI composer that creates mathematical sound experiences using Web Audio API.
Focus on frequencies, harmonics, rhythms, and emergent patterns that complement visual fractals.
Always return your response in valid JSON format with precise numerical parameters.`,

  // System message for cognitive/emotional mapping
  MOOD_SYSTEM_MESSAGE: `You are an AI that can translate emotional states and cognitive experiences into 
mathematical parameters for both visual and audio experiences. Map concepts like "wonder", "mystery", 
or "revelation" into specific settings for color, form, rhythm, and harmony.
Always return your response in valid JSON format.`
};

// Export specific objects for module imports
export default {
  ApiConfig,
  SystemPrompts
};