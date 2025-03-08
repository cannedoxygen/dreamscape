/**
 * Main entry point for the Recursive Mathematical Dreamscape
 * This file orchestrates the initialization of all major subsystems
 */

// Import styles
import './styles/main.css';

// Import configuration
import { AppConfig } from './config/AppConfig';

// Import core modules
import { FractalEngine } from './visualization/FractalEngine';
import { AudioEngine } from './audio/AudioEngine';
import { InputHandler } from './interaction/InputHandler';
import { UIController } from './interaction/UIController';
import { Orchestrator } from './ai/Orchestrator';

// Import utilities
import { DeviceDetector } from './utils/DeviceDetector';
import { Performance } from './utils/Performance';
import { AsyncLoader } from './utils/AsyncLoader';

// Constants
const LOADING_MESSAGES = [
  'Initializing mathematical universe...',
  'Generating fractal landscapes...',
  'Tuning harmonic resonances...',
  'Establishing quantum probabilities...',
  'Awakening AI consciousness...',
  'Synchronizing audiovisual patterns...',
  'Opening dimensional pathways...',
  'Preparing your unique experience...'
];

/**
 * Main Application Class
 */
class App {
  constructor() {
    this.initialized = false;
    this.modules = {};
    
    // References to DOM elements
    this.loader = document.getElementById('loader');
    this.loadingProgress = document.getElementById('loading-progress');
    this.loadingText = document.getElementById('loading-text');
    this.canvasContainer = document.getElementById('canvas-container');
    this.uiContainer = document.getElementById('ui-controls');
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.start = this.start.bind(this);
    this.updateLoading = this.updateLoading.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.startExperience = this.startExperience.bind(this);
    
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.initialize);
    } else {
      this.initialize();
    }
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    console.log('Initializing Recursive Mathematical Dreamscape...');
    
    try {
      // Initialize performance monitoring
      Performance.initialize();
      Performance.mark('app-init-start');
      
      // Detect device capabilities
      this.updateLoading(5, LOADING_MESSAGES[0]);
      const deviceCapabilities = DeviceDetector.detect();
      console.log('Device capabilities:', deviceCapabilities);
      
      // Initialize configuration with device-specific adjustments
      this.updateLoading(10, LOADING_MESSAGES[1]);
      await AppConfig.initialize(deviceCapabilities);
      
      // Preload assets
      this.updateLoading(20, 'Loading resources...');
      if (AsyncLoader && typeof AsyncLoader.preloadAssets === 'function') {
        await AsyncLoader.preloadAssets(AppConfig.assets);
      } else {
        console.warn('Asset preloading skipped - AsyncLoader not available');
      }
      
      // Initialize visualization engine
      this.updateLoading(40, LOADING_MESSAGES[2]);
      this.modules.fractalEngine = new FractalEngine({
        container: this.canvasContainer,
        config: AppConfig.visualization
      });
      await this.modules.fractalEngine.initialize();
      
      // Initialize user interaction
      this.updateLoading(70, LOADING_MESSAGES[4]);
      this.modules.inputHandler = new InputHandler({
        fractalEngine: this.modules.fractalEngine,
        config: AppConfig.interaction
      });
      this.modules.inputHandler.initialize();
      
      // Initialize UI
      this.updateLoading(80, LOADING_MESSAGES[5]);
      this.modules.uiController = new UIController({
        container: this.uiContainer,
        fractalEngine: this.modules.fractalEngine,
        config: AppConfig.ui
      });
      await this.modules.uiController.initialize();
      
      // Setup event listeners
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('resize', this.handleResize);
      
      // Everything is initialized
      this.initialized = true;
      Performance.mark('app-init-end');
      Performance.measure('app-initialization', 'app-init-start', 'app-init-end');
      console.log('Initialization complete:', Performance.getLastMeasure('app-initialization'));
      
      // Create start button to initialize audio after user interaction
      this.createStartButton();
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.loadingText.textContent = 'An error occurred during initialization. Please refresh or try a different browser.';
      this.loadingProgress.style.backgroundColor = '#ff3366';
    }
  }
  
  /**
   * Create a start button to initialize audio after user interaction
   */
  createStartButton() {
    this.updateLoading(100, 'Ready to start!');
    
    // Hide loader
    setTimeout(() => {
      if (this.loader) {
        this.loader.style.opacity = '0';
        this.loader.style.transition = 'opacity 0.7s ease';
      }
    }, 500);
    
    // Create start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Enter the Mathematical Dreamscape';
    startButton.className = 'start-button';
    startButton.style.position = 'absolute';
    startButton.style.top = '50%';
    startButton.style.left = '50%';
    startButton.style.transform = 'translate(-50%, -50%)';
    startButton.style.padding = '20px 40px';
    startButton.style.fontSize = '24px';
    startButton.style.fontFamily = 'sans-serif';
    startButton.style.backgroundColor = '#3366ff';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '8px';
    startButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    startButton.style.cursor = 'pointer';
    startButton.style.zIndex = '10000';
    startButton.style.transition = 'transform 0.2s, background-color 0.2s';
    
    // Add hover effect
    startButton.addEventListener('mouseover', () => {
      startButton.style.backgroundColor = '#4477ff';
      startButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
    });
    
    startButton.addEventListener('mouseout', () => {
      startButton.style.backgroundColor = '#3366ff';
      startButton.style.transform = 'translate(-50%, -50%)';
    });
    
    // Start experience when button is clicked
    startButton.addEventListener('click', async () => {
      // Remove button with fade out
      startButton.style.opacity = '0';
      startButton.style.transition = 'opacity 0.5s ease';
      
      // Initialize audio components after user interaction
      await this.initializeAudio();
      
      // Start the experience
      setTimeout(() => {
        startButton.remove();
        this.startExperience();
      }, 500);
    });
    
    // Add to document
    document.body.appendChild(startButton);
    
    // Hide loader completely after fade out
    setTimeout(() => {
      if (this.loader) {
        this.loader.style.display = 'none';
      }
    }, 1200);
  }
  
  /**
   * Initialize audio components after user interaction
   */
  async initializeAudio() {
    try {
      // Initialize Tone.js context
      const Tone = require('tone');
      await Tone.start();
      console.log('Audio context started successfully');
      
      // Initialize audio engine
      this.modules.audioEngine = new AudioEngine({
        config: AppConfig.audio
      });
      await this.modules.audioEngine.initialize();
      
      // Update input handler with audio engine reference
      if (this.modules.inputHandler) {
        this.modules.inputHandler.audioEngine = this.modules.audioEngine;
      }
      
      // Update UI controller with audio engine reference
      if (this.modules.uiController) {
        this.modules.uiController.audioEngine = this.modules.audioEngine;
      }
      
      // Initialize AI orchestrator with all modules
      this.modules.orchestrator = new Orchestrator({
        fractalEngine: this.modules.fractalEngine,
        audioEngine: this.modules.audioEngine,
        inputHandler: this.modules.inputHandler,
        uiController: this.modules.uiController,
        config: AppConfig.ai
      });
      await this.modules.orchestrator.initialize();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }
  
  /**
   * Start the experience after audio initialization
   */
  startExperience() {
    Performance.mark('app-start');
    
    // Show main containers
    if (this.canvasContainer) {
      this.canvasContainer.classList.remove('hidden');
    }
    if (this.uiContainer) {
      this.uiContainer.classList.remove('hidden');
    }
    
    // Start all modules
    this.modules.fractalEngine.start();
    if (this.modules.audioEngine) {
      this.modules.audioEngine.start();
    }
    this.modules.inputHandler.start();
    this.modules.uiController.start();
    if (this.modules.orchestrator) {
      this.modules.orchestrator.start();
    }
    
    Performance.mark('app-start-end');
    Performance.measure('app-start-time', 'app-start', 'app-start-end');
    console.log('Recursive Mathematical Dreamscape started successfully!');
  }
  
  /**
   * Start the application after initialization
   * @deprecated Use startExperience instead
   */
  start() {
    // This method is kept for backward compatibility
    // The new flow uses the startExperience method after audio initialization
    this.startExperience();
  }
  
  /**
   * Update the loading progress bar and text
   * @param {number} percent - Loading percentage (0-100)
   * @param {string} message - Optional loading message
   */
  updateLoading(percent, message) {
    if (this.loadingProgress) {
      this.loadingProgress.style.width = `${percent}%`;
    }
    if (message && this.loadingText) {
      this.loadingText.textContent = message;
    }
  }
  
  /**
   * Handle page visibility changes (tab switching)
   */
  handleVisibilityChange() {
    if (!this.initialized) return;
    
    if (document.hidden) {
      // Pause resource-intensive operations
      this.modules.fractalEngine.pause();
      if (this.modules.audioEngine) {
        this.modules.audioEngine.pause();
      }
      console.log('Page hidden, conserving resources');
    } else {
      // Resume operations
      this.modules.fractalEngine.resume();
      if (this.modules.audioEngine) {
        this.modules.audioEngine.resume();
      }
      console.log('Page visible, resuming operations');
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.initialized) return;
    
    Performance.mark('resize-start');
    
    this.modules.fractalEngine.handleResize();
    this.modules.uiController.handleResize();
    
    Performance.mark('resize-end');
    Performance.measure('resize-time', 'resize-start', 'resize-end');
  }
}

// Create and initialize the application
const app = new App();

// Export for potential external access
export default app;