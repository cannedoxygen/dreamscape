/**
 * AICache.js
 * 
 * A caching system for AI API responses to:
 * - Reduce API costs by reusing responses
 * - Improve response time for repeated queries
 * - Reduce rate limiting issues
 * - Provide fallbacks when offline
 */

export class AICache {
    constructor(options = {}) {
      // Cache configuration
      this.maxSize = options.maxSize || 100;
      this.ttl = options.ttl || 3600000; // Default TTL: 1 hour in milliseconds
      
      // Initialize cache storage
      this.cache = new Map();
      this.keyTimestamps = new Map();
      this.hitCount = 0;
      this.missCount = 0;
      
      // Set up periodic cleanup
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // Cleanup every 5 minutes
      
      // Bind methods
      this.get = this.get.bind(this);
      this.set = this.set.bind(this);
      this.has = this.has.bind(this);
      this.delete = this.delete.bind(this);
      this.clear = this.clear.bind(this);
      this.cleanup = this.cleanup.bind(this);
      this.getStats = this.getStats.bind(this);
      
      // Load cache from localStorage if available
      this.loadCache();
    }
    
    /**
     * Get an item from the cache
     * 
     * @param {string} key - The cache key
     * @returns {any|null} - The cached value or null if not found or expired
     */
    get(key) {
      // Check if key exists
      if (!this.cache.has(key)) {
        this.missCount++;
        return null;
      }
      
      // Check if item has expired
      const timestamp = this.keyTimestamps.get(key) || 0;
      const now = Date.now();
      
      if (now - timestamp > this.ttl) {
        // Item has expired, remove it
        this.delete(key);
        this.missCount++;
        return null;
      }
      
      // Return cached item
      this.hitCount++;
      return this.cache.get(key);
    }
    
    /**
     * Store an item in the cache
     * 
     * @param {string} key - The cache key
     * @param {any} value - The value to cache
     * @param {number} customTtl - Optional custom TTL for this specific item
     */
    set(key, value, customTtl = null) {
      // If cache is at max size, remove oldest item
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.removeOldest();
      }
      
      // Store the item
      this.cache.set(key, value);
      this.keyTimestamps.set(key, Date.now());
      
      // If a custom TTL was provided, store it for this key
      if (customTtl !== null) {
        this.keyTimestamps.set(`${key}:ttl`, customTtl);
      }
      
      // Save to localStorage
      this.saveCache();
      
      return true;
    }
    
    /**
     * Check if a key exists in the cache and is not expired
     * 
     * @param {string} key - The cache key
     * @returns {boolean} - True if the key exists and is not expired
     */
    has(key) {
      if (!this.cache.has(key)) {
        return false;
      }
      
      const timestamp = this.keyTimestamps.get(key) || 0;
      const now = Date.now();
      const itemTtl = this.keyTimestamps.get(`${key}:ttl`) || this.ttl;
      
      return (now - timestamp <= itemTtl);
    }
    
    /**
     * Delete an item from the cache
     * 
     * @param {string} key - The cache key
     * @returns {boolean} - True if the item was deleted
     */
    delete(key) {
      this.keyTimestamps.delete(key);
      this.keyTimestamps.delete(`${key}:ttl`);
      const result = this.cache.delete(key);
      
      // Save to localStorage
      this.saveCache();
      
      return result;
    }
    
    /**
     * Clear all items from the cache
     */
    clear() {
      this.cache.clear();
      this.keyTimestamps.clear();
      this.hitCount = 0;
      this.missCount = 0;
      
      // Clear localStorage
      try {
        localStorage.removeItem('aiCache');
        localStorage.removeItem('aiCacheTimestamps');
      } catch (error) {
        console.error('[AICache] Error clearing localStorage:', error);
      }
      
      return true;
    }
    
    /**
     * Remove expired items from the cache
     */
    cleanup() {
      const now = Date.now();
      let cleanupCount = 0;
      
      // Check each item for expiration
      for (const [key, timestamp] of this.keyTimestamps.entries()) {
        // Skip TTL entries
        if (key.includes(':ttl')) continue;
        
        const itemTtl = this.keyTimestamps.get(`${key}:ttl`) || this.ttl;
        
        if (now - timestamp > itemTtl) {
          this.delete(key);
          cleanupCount++;
        }
      }
      
      if (cleanupCount > 0) {
        console.log(`[AICache] Cleaned up ${cleanupCount} expired items`);
      }
    }
    
    /**
     * Remove the oldest item from the cache
     */
    removeOldest() {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      // Find the oldest item
      for (const [key, timestamp] of this.keyTimestamps.entries()) {
        // Skip TTL entries
        if (key.includes(':ttl')) continue;
        
        if (timestamp < oldestTime) {
          oldestTime = timestamp;
          oldestKey = key;
        }
      }
      
      // Remove the oldest item
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }
    
    /**
     * Get cache statistics
     * 
     * @returns {Object} - Cache statistics
     */
    getStats() {
      const totalRequests = this.hitCount + this.missCount;
      const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
      
      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        hitCount: this.hitCount,
        missCount: this.missCount,
        hitRate: hitRate.toFixed(2) + '%',
        ttl: this.ttl,
        oldestItem: this.getOldestItemAge()
      };
    }
    
    /**
     * Get the age of the oldest item in the cache
     * 
     * @returns {number} - Age in milliseconds
     */
    getOldestItemAge() {
      let oldestTime = Infinity;
      const now = Date.now();
      
      for (const timestamp of this.keyTimestamps.values()) {
        if (timestamp < oldestTime) {
          oldestTime = timestamp;
        }
      }
      
      return oldestTime === Infinity ? 0 : now - oldestTime;
    }
    
    /**
     * Save the cache to localStorage
     */
    saveCache() {
      try {
        // Convert Map to Object for localStorage
        const cacheObj = Object.fromEntries(this.cache);
        const timestampsObj = Object.fromEntries(this.keyTimestamps);
        
        localStorage.setItem('aiCache', JSON.stringify(cacheObj));
        localStorage.setItem('aiCacheTimestamps', JSON.stringify(timestampsObj));
        localStorage.setItem('aiCacheStats', JSON.stringify({
          hitCount: this.hitCount,
          missCount: this.missCount
        }));
      } catch (error) {
        console.error('[AICache] Error saving to localStorage:', error);
        // If we hit a quota error, clear some space
        if (error.name === 'QuotaExceededError') {
          this.removeOldest();
          this.removeOldest();
          this.removeOldest();
          // Try again with less data
          this.saveCache();
        }
      }
    }
    
    /**
     * Load the cache from localStorage
     */
    loadCache() {
      try {
        const cacheJson = localStorage.getItem('aiCache');
        const timestampsJson = localStorage.getItem('aiCacheTimestamps');
        const statsJson = localStorage.getItem('aiCacheStats');
        
        if (cacheJson && timestampsJson) {
          const cacheObj = JSON.parse(cacheJson);
          const timestampsObj = JSON.parse(timestampsJson);
          
          // Convert Objects back to Maps
          this.cache = new Map(Object.entries(cacheObj));
          this.keyTimestamps = new Map(Object.entries(timestampsObj));
          
          // Load stats if available
          if (statsJson) {
            const stats = JSON.parse(statsJson);
            this.hitCount = stats.hitCount || 0;
            this.missCount = stats.missCount || 0;
          }
          
          console.log(`[AICache] Loaded ${this.cache.size} items from localStorage`);
          
          // Clean up expired items immediately
          this.cleanup();
        }
      } catch (error) {
        console.error('[AICache] Error loading from localStorage:', error);
        // If there was an error loading, start with a fresh cache
        this.clear();
      }
    }
    
    /**
     * Destructor to clean up resources
     */
    destroy() {
      clearInterval(this.cleanupInterval);
      this.saveCache();
    }
  }
  
  export default AICache;