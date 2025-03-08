/**
 * OpenAIClient.js
 * 
 * A client for interacting with the OpenAI API.
 * Handles authentication, request formatting, and response processing.
 */

import TokenManager from './TokenManager';
import { AICache } from './AICache';
import { ApiConfig } from '../../config/ApiConfig';

export class OpenAIClient {
  constructor(options = {}) {
    this.apiKey = process.env.OPENAI_API_KEY || ApiConfig.OPENAI_API_KEY;
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    this.model = options.model || 'gpt-4-turbo'; // Default to most capable model
    this.organization = options.organization || null;
    
    // Default request parameters
    this.defaultParams = {
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
      top_p: options.topP || 1,
      frequency_penalty: options.frequencyPenalty || 0,
      presence_penalty: options.presencePenalty || 0
    };
    
    // Initialize token manager for tracking usage
    this.tokenManager = new TokenManager();
    
    // Initialize cache
    this.cache = new AICache({
      maxSize: options.cacheSize || 50,
      ttl: options.cacheTTL || 3600000 // 1 hour in milliseconds
    });
    
    // Track if we're simulating responses (for testing or development)
    this.simulateResponses = options.simulateResponses || false;
    
    // Request queue for rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestDelay = options.requestDelay || 500; // ms between requests
    
    // Bind methods
    this.processQueue = this.processQueue.bind(this);
  }
  
  /**
   * Create a completion with the OpenAI API
   * 
   * @param {string} prompt - The prompt to send to the API
   * @param {Object} options - Additional options to override defaults
   * @returns {Promise<Object>} - The API response
   */
  async createCompletion(prompt, options = {}) {
    const params = {
      ...this.defaultParams,
      ...options,
      model: options.model || this.model,
      messages: [
        { role: "system", content: "You are an AI assistant helping to create a mathematical dreamscape experience." },
        { role: "user", content: prompt }
      ]
    };
    
    // Check cache first if enabled
    const cacheKey = this.getCacheKey(prompt, params);
    if (ApiConfig.ENABLE_CACHE) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        console.log('Using cached OpenAI response');
        return cachedResponse;
      }
    }
    
    // If we're simulating responses, return a mock response
    if (this.simulateResponses) {
      return this.getSimulatedResponse(prompt, params);
    }
    
    // Add request to queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        endpoint: 'chat/completions',
        params,
        cacheKey,
        resolve,
        reject
      });
      
      // Start processing queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Generate an image with DALL-E
   * 
   * @param {string} prompt - The image description
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - The API response
   */
  async createImage(prompt, options = {}) {
    const params = {
      prompt,
      n: options.n || 1,
      size: options.size || "1024x1024",
      response_format: options.responseFormat || "url"
    };
    
    // Check cache first if enabled
    const cacheKey = this.getCacheKey(prompt, params);
    if (ApiConfig.ENABLE_CACHE) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        console.log('Using cached OpenAI image response');
        return cachedResponse;
      }
    }
    
    // Add request to queue
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        endpoint: 'images/generations',
        params,
        cacheKey,
        resolve,
        reject
      });
      
      // Start processing queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process the request queue with rate limiting
   */
  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    const request = this.requestQueue.shift();
    
    try {
      // Make API request
      const response = await this.makeRequest(request.endpoint, request.params);
      
      // Update token usage
      if (response.usage) {
        this.tokenManager.trackUsage(response.usage);
      }
      
      // Cache the response if caching is enabled
      if (ApiConfig.ENABLE_CACHE) {
        this.cache.set(request.cacheKey, response);
      }
      
      // Resolve the promise
      request.resolve(response);
    } catch (error) {
      console.error('OpenAI API error:', error);
      request.reject(error);
    }
    
    // Process next request after delay
    setTimeout(this.processQueue, this.requestDelay);
  }
  
  /**
   * Make a request to the OpenAI API
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - The API response
   */
  async makeRequest(endpoint, params) {
    const url = `${this.baseUrl}/${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Generate a cache key for a request
   * 
   * @param {string} prompt - The prompt
   * @param {Object} params - Request parameters
   * @returns {string} - A unique cache key
   */
  getCacheKey(prompt, params) {
    // Create a simplified version of params for the cache key
    const keyParams = {
      model: params.model,
      temperature: params.temperature,
      max_tokens: params.max_tokens
    };
    
    return `${prompt}|${JSON.stringify(keyParams)}`;
  }
  
  /**
   * Generate a simulated response for testing purposes
   * 
   * @param {string} prompt - The prompt
   * @param {Object} params - Request parameters
   * @returns {Object} - A mock response
   */
  getSimulatedResponse(prompt, params) {
    console.log('Simulating OpenAI response for:', prompt);
    
    // Create a simulated completion response
    const response = {
      id: `simulated-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: params.model,
      choices: [
        {
          message: {
            role: "assistant",
            content: `This is a simulated response for: "${prompt.substring(0, 50)}..."`
          },
          finish_reason: 'stop',
          index: 0
        }
      ],
      usage: {
        prompt_tokens: Math.floor(prompt.length / 4),
        completion_tokens: 20,
        total_tokens: Math.floor(prompt.length / 4) + 20
      }
    };
    
    // Add specific content based on prompt keywords
    if (prompt.includes('fractal')) {
      response.choices[0].message.content = `I recommend a modified Julia set with parameters c = -0.8 + 0.156i and exponent = 2. The color palette should be deep blues transitioning to purples, with a glow effect of 0.7 intensity. This creates a cosmic, dreamy feel with spiraling tendrils that evoke contemplation.`;
    } else if (prompt.includes('sound') || prompt.includes('audio')) {
      response.choices[0].message.content = `For the audio environment, I suggest a harmonic series based on 432Hz as the fundamental frequency, with subtle binaural beating at 8Hz (alpha wave range). Add periodic bell-like tones at 0.8 volume with 5-8 second intervals for a meditative quality.`;
    } else if (prompt.includes('mood') || prompt.includes('emotion')) {
      response.choices[0].message.content = `To create a sense of wonder and discovery, I recommend high contrast visuals with unexpected color transitions. The audio should feature ascending melodic patterns that create tension then resolve. Introduce quantum randomness at 40% to create occasional surprising visual elements that delight the user.`;
    }
    
    // Simulate API latency
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(response);
      }, 500);
    });
  }
  
  /**
   * Get the current token usage statistics
   * 
   * @returns {Object} - Token usage data
   */
  getTokenUsage() {
    return this.tokenManager.getUsage();
  }
  
  /**
   * Clear the response cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default OpenAIClient;