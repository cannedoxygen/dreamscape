/**
 * UIController.js
 * 
 * Manages the user interface elements of the application.
 * Creates, updates, and manages UI components and their interactions.
 */

import { Performance } from '../utils/Performance';

export class UIController {
  /**
   * Initialize the UIController
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.container = options.container;
    this.fractalEngine = options.fractalEngine;
    this.audioEngine = options.audioEngine;
    this.config = options.config || {};
    
    this.isInitialized = false;
    this.isActive = false;
    
    // UI elements references
    this.elements = {
      controls: {},
      panels: {},
      info: {},
      modals: {}
    };
    
    // UI state
    this.state = {
      activePanel: 'main',
      isControlsVisible: true,
      isInfoVisible: false,
      activeModal: null,
      notifications: [],
      highlightedElement: null,
      infoUpdateInterval: null
    };
    
    // Callbacks for UI events
    this.callbacks = {
      onParameterChange: [],
      onFractalChange: [],
      onModeChange: [],
      onUIInteraction: []
    };
    
    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.updatePerformanceInfo = this.updatePerformanceInfo.bind(this);
  }
  
  /**
   * Initialize the UI controller
   * @returns {Promise} - Resolves when initialization is complete
   */
  async initialize() {
    Performance.mark('ui-init-start');
    
    try {
      console.log('Initializing UI Controller...');
      
      // Check if container exists
      if (!this.container) {
        console.error('UI container element not found');
        return Promise.reject(new Error('UI container element not found'));
      }
      
      // Create UI elements
      await this.createUIElements();
      
      // Apply configuration
      this.updateFromConfig();
      
      // Add event listeners
      this.addEventListeners();
      
      // Start periodic info updates
      this.startInfoUpdates();
      
      this.isInitialized = true;
      
      Performance.mark('ui-init-end');
      Performance.measure('ui-initialization', 'ui-init-start', 'ui-init-end');
      
      console.log('UI Controller initialized', Performance.getLastMeasure('ui-initialization'));
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize UI Controller:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Update from configuration
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Apply UI configuration settings
    if (this.config.theme) {
      this.setTheme(this.config.theme);
    }
    
    if (this.config.initialPanel) {
      this.showPanel(this.config.initialPanel);
    }
    
    if (this.config.controlsVisible !== undefined) {
      this.toggleControlsVisibility(this.config.controlsVisible);
    }
    
    if (this.config.infoVisible !== undefined) {
      this.toggleInfoVisibility(this.config.infoVisible);
    }
    
    // Apply any preset values to UI controls
    if (this.config.presets && this.config.initialPreset) {
      const preset = this.config.presets[this.config.initialPreset];
      if (preset) {
        this.applyPresetToUI(preset);
      }
    }
  }
  
  /**
   * Create all UI elements
   * @returns {Promise} - Resolves when UI elements are created
   */
  async createUIElements() {
    // Clear container
    this.container.innerHTML = '';
    this.container.className = 'ui-container';
    
    // Create main UI structure
    await this.createMainPanel();
    await this.createFractalControls();
    await this.createAudioControls();
    await this.createInfoPanel();
    await this.createModals();
    
    return Promise.resolve();
  }
  
  /**
   * Create the main control panel
   * @returns {Promise} - Resolves when panel is created
   */
  async createMainPanel() {
    // Create main panel
    const mainPanel = document.createElement('div');
    mainPanel.className = 'ui-panel main-panel';
    mainPanel.id = 'main-panel';
    
    // Create title area
    const titleArea = document.createElement('div');
    titleArea.className = 'panel-title';
    
    const title = document.createElement('h2');
    title.textContent = 'Recursive Mathematical Dreamscape';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    subtitle.textContent = 'Interactive Fractal Explorer';
    
    titleArea.appendChild(title);
    titleArea.appendChild(subtitle);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Create main action buttons
    const buttons = [
      { id: 'fractal-button', text: 'Fractal', panel: 'fractal' },
      { id: 'audio-button', text: 'Audio', panel: 'audio' },
      { id: 'ai-button', text: 'AI Assist', action: 'openAIModal' },
      { id: 'info-button', text: 'Info', action: 'toggleInfo' }
    ];
    
    buttons.forEach(buttonInfo => {
      const button = document.createElement('button');
      button.id = buttonInfo.id;
      button.className = 'ui-button';
      button.textContent = buttonInfo.text;
      
      if (buttonInfo.panel) {
        button.addEventListener('click', () => this.showPanel(buttonInfo.panel));
      } else if (buttonInfo.action) {
        button.addEventListener('click', () => this[buttonInfo.action]());
      }
      
      buttonContainer.appendChild(button);
      this.elements.controls[buttonInfo.id] = button;
    });
    
    // Create additional controls for the main panel
    const controls = document.createElement('div');
    controls.className = 'main-controls';
    
    // Mode selector
    const modeContainer = document.createElement('div');
    modeContainer.className = 'control-group';
    
    const modeLabel = document.createElement('label');
    modeLabel.textContent = 'Experience Mode';
    modeLabel.setAttribute('for', 'mode-select');
    
    const modeSelect = document.createElement('select');
    modeSelect.id = 'mode-select';
    modeSelect.className = 'select-control';
    
    const modes = [
      { value: 'contemplative', text: 'Contemplative' },
      { value: 'exploratory', text: 'Exploratory' },
      { value: 'energetic', text: 'Energetic' },
      { value: 'quantum', text: 'Quantum' }
    ];
    
    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.text;
      modeSelect.appendChild(option);
    });
    
    modeSelect.addEventListener('change', () => {
      this.triggerCallback('onModeChange', { mode: modeSelect.value });
    });
    
    modeContainer.appendChild(modeLabel);
    modeContainer.appendChild(modeSelect);
    
    this.elements.controls['mode-select'] = modeSelect;
    
    // AI adaptation slider
    const adaptationContainer = document.createElement('div');
    adaptationContainer.className = 'control-group';
    
    const adaptationLabel = document.createElement('label');
    adaptationLabel.textContent = 'AI Adaptation';
    adaptationLabel.setAttribute('for', 'adaptation-slider');
    
    const adaptationSlider = document.createElement('input');
    adaptationSlider.type = 'range';
    adaptationSlider.id = 'adaptation-slider';
    adaptationSlider.className = 'slider-control';
    adaptationSlider.min = 0;
    adaptationSlider.max = 100;
    adaptationSlider.value = 50;
    
    const adaptationValue = document.createElement('span');
    adaptationValue.className = 'slider-value';
    adaptationValue.textContent = '50%';
    
    adaptationSlider.addEventListener('input', () => {
      adaptationValue.textContent = `${adaptationSlider.value}%`;
      this.triggerCallback('onParameterChange', { 
        name: 'adaptationLevel', 
        value: adaptationSlider.value / 100
      });
    });
    
    adaptationContainer.appendChild(adaptationLabel);
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.appendChild(adaptationSlider);
    sliderContainer.appendChild(adaptationValue);
    
    adaptationContainer.appendChild(sliderContainer);
    
    this.elements.controls['adaptation-slider'] = adaptationSlider;
    
    // Quantum randomness slider
    const randomnessContainer = document.createElement('div');
    randomnessContainer.className = 'control-group';
    
    const randomnessLabel = document.createElement('label');
    randomnessLabel.textContent = 'Quantum Randomness';
    randomnessLabel.setAttribute('for', 'randomness-slider');
    
    const randomnessSlider = document.createElement('input');
    randomnessSlider.type = 'range';
    randomnessSlider.id = 'randomness-slider';
    randomnessSlider.className = 'slider-control';
    randomnessSlider.min = 0;
    randomnessSlider.max = 100;
    randomnessSlider.value = 30;
    
    const randomnessValue = document.createElement('span');
    randomnessValue.className = 'slider-value';
    randomnessValue.textContent = '30%';
    
    randomnessSlider.addEventListener('input', () => {
      randomnessValue.textContent = `${randomnessSlider.value}%`;
      this.triggerCallback('onParameterChange', { 
        name: 'quantumRandomness', 
        value: randomnessSlider.value / 100
      });
    });
    
    randomnessContainer.appendChild(randomnessLabel);
    
    const randomnessSliderContainer = document.createElement('div');
    randomnessSliderContainer.className = 'slider-container';
    randomnessSliderContainer.appendChild(randomnessSlider);
    randomnessSliderContainer.appendChild(randomnessValue);
    
    randomnessContainer.appendChild(randomnessSliderContainer);
    
    this.elements.controls['randomness-slider'] = randomnessSlider;
    
    // Add control groups to main controls
    controls.appendChild(modeContainer);
    controls.appendChild(adaptationContainer);
    controls.appendChild(randomnessContainer);
    
    // Create randomize and reset buttons
    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-container';
    
    const randomizeButton = document.createElement('button');
    randomizeButton.id = 'randomize-button';
    randomizeButton.className = 'ui-button action-button';
    randomizeButton.textContent = 'Random Variation';
    
    randomizeButton.addEventListener('click', () => {
      this.triggerCallback('onUIInteraction', { 
        type: 'button', 
        action: 'randomize' 
      });
    });
    
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button';
    resetButton.className = 'ui-button action-button';
    resetButton.textContent = 'Reset View';
    
    resetButton.addEventListener('click', () => {
      this.triggerCallback('onUIInteraction', { 
        type: 'button', 
        action: 'reset' 
      });
    });
    
    actionContainer.appendChild(randomizeButton);
    actionContainer.appendChild(resetButton);
    
    this.elements.controls['randomize-button'] = randomizeButton;
    this.elements.controls['reset-button'] = resetButton;
    
    // Create performance info area
    const performanceInfo = document.createElement('div');
    performanceInfo.className = 'performance-info';
    performanceInfo.id = 'performance-info';
    
    this.elements.info['performance'] = performanceInfo;
    
    // Assemble main panel
    mainPanel.appendChild(titleArea);
    mainPanel.appendChild(buttonContainer);
    mainPanel.appendChild(controls);
    mainPanel.appendChild(actionContainer);
    mainPanel.appendChild(performanceInfo);
    
    // Add main panel to container
    this.container.appendChild(mainPanel);
    this.elements.panels['main'] = mainPanel;
    
    return Promise.resolve();
  }
  
  /**
   * Create fractal control panel
   * @returns {Promise} - Resolves when panel is created
   */
  async createFractalControls() {
    // Create fractal panel
    const fractalPanel = document.createElement('div');
    fractalPanel.className = 'ui-panel fractal-panel hidden';
    fractalPanel.id = 'fractal-panel';
    
    // Create title area
    const titleArea = document.createElement('div');
    titleArea.className = 'panel-title';
    
    const title = document.createElement('h2');
    title.textContent = 'Fractal Controls';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.showPanel('main'));
    
    titleArea.appendChild(title);
    titleArea.appendChild(closeButton);
    
    // Create fractal controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'panel-controls';
    
    // Fractal type selector
    const typeContainer = document.createElement('div');
    typeContainer.className = 'control-group';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Fractal Type';
    typeLabel.setAttribute('for', 'fractal-type');
    
    const typeSelect = document.createElement('select');
    typeSelect.id = 'fractal-type';
    typeSelect.className = 'select-control';
    
    const fractalTypes = [
      { value: 'mandelbrot', text: 'Mandelbrot Set' },
      { value: 'julia', text: 'Julia Set' },
      { value: 'burningShip', text: 'Burning Ship' },
      { value: 'mandelbulb', text: '3D Mandelbulb' },
      { value: 'hyperbolic', text: 'Hyperbolic Tiling' }
    ];
    
    fractalTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.text;
      typeSelect.appendChild(option);
    });
    
    typeSelect.addEventListener('change', () => {
      this.triggerCallback('onFractalChange', { type: typeSelect.value });
    });
    
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelect);
    
    this.elements.controls['fractal-type'] = typeSelect;
    
    // Create sliders for fractal parameters
    const sliders = [
      { 
        id: 'iterations-slider', 
        label: 'Iterations', 
        min: 50, 
        max: 500, 
        value: 100, 
        step: 10,
        paramName: 'iterations' 
      },
      { 
        id: 'exponent-slider', 
        label: 'Exponent', 
        min: 2, 
        max: 5, 
        value: 2, 
        step: 0.1,
        paramName: 'exponent' 
      },
      { 
        id: 'color-shift-slider', 
        label: 'Color Shift', 
        min: 0, 
        max: 1, 
        value: 0, 
        step: 0.01,
        paramName: 'colorShift' 
      },
      { 
        id: 'rotation-slider', 
        label: 'Rotation', 
        min: 0, 
        max: 6.28, 
        value: 0, 
        step: 0.01,
        paramName: 'rotationAngle' 
      }
    ];
    
    sliders.forEach(sliderInfo => {
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'control-group';
      
      const sliderLabel = document.createElement('label');
      sliderLabel.textContent = sliderInfo.label;
      sliderLabel.setAttribute('for', sliderInfo.id);
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = sliderInfo.id;
      slider.className = 'slider-control';
      slider.min = sliderInfo.min;
      slider.max = sliderInfo.max;
      slider.value = sliderInfo.value;
      slider.step = sliderInfo.step;
      
      const sliderValue = document.createElement('span');
      sliderValue.className = 'slider-value';
      sliderValue.textContent = sliderInfo.value;
      
      slider.addEventListener('input', () => {
        sliderValue.textContent = slider.value;
        this.triggerCallback('onParameterChange', { 
          name: sliderInfo.paramName, 
          value: parseFloat(slider.value)
        });
      });
      
      sliderContainer.appendChild(sliderLabel);
      
      const sliderControlContainer = document.createElement('div');
      sliderControlContainer.className = 'slider-container';
      sliderControlContainer.appendChild(slider);
      sliderControlContainer.appendChild(sliderValue);
      
      sliderContainer.appendChild(sliderControlContainer);
      
      controlsContainer.appendChild(sliderContainer);
      this.elements.controls[sliderInfo.id] = slider;
    });
    
    // Julia set specific controls
    const juliaContainer = document.createElement('div');
    juliaContainer.className = 'control-group julia-controls';
    juliaContainer.id = 'julia-controls';
    
    const juliaLabel = document.createElement('div');
    juliaLabel.className = 'group-label';
    juliaLabel.textContent = 'Julia Set Parameters';
    
    // Julia real parameter
    const juliaRealContainer = document.createElement('div');
    juliaRealContainer.className = 'sub-control';
    
    const juliaRealLabel = document.createElement('label');
    juliaRealLabel.textContent = 'Real';
    juliaRealLabel.setAttribute('for', 'julia-real');
    
    const juliaRealSlider = document.createElement('input');
    juliaRealSlider.type = 'range';
    juliaRealSlider.id = 'julia-real';
    juliaRealSlider.className = 'slider-control';
    juliaRealSlider.min = -2;
    juliaRealSlider.max = 2;
    juliaRealSlider.value = -0.7;
    juliaRealSlider.step = 0.01;
    
    const juliaRealValue = document.createElement('span');
    juliaRealValue.className = 'slider-value';
    juliaRealValue.textContent = '-0.7';
    
    juliaRealSlider.addEventListener('input', () => {
      juliaRealValue.textContent = juliaRealSlider.value;
      this.triggerCallback('onParameterChange', { 
        name: 'juliaReal', 
        value: parseFloat(juliaRealSlider.value)
      });
    });
    
    juliaRealContainer.appendChild(juliaRealLabel);
    
    const juliaRealSliderContainer = document.createElement('div');
    juliaRealSliderContainer.className = 'slider-container';
    juliaRealSliderContainer.appendChild(juliaRealSlider);
    juliaRealSliderContainer.appendChild(juliaRealValue);
    
    juliaRealContainer.appendChild(juliaRealSliderContainer);
    
    // Julia imaginary parameter
    const juliaImagContainer = document.createElement('div');
    juliaImagContainer.className = 'sub-control';
    
    const juliaImagLabel = document.createElement('label');
    juliaImagLabel.textContent = 'Imaginary';
    juliaImagLabel.setAttribute('for', 'julia-imag');
    
    const juliaImagSlider = document.createElement('input');
    juliaImagSlider.type = 'range';
    juliaImagSlider.id = 'julia-imag';
    juliaImagSlider.className = 'slider-control';
    juliaImagSlider.min = -2;
    juliaImagSlider.max = 2;
    juliaImagSlider.value = 0.27;
    juliaImagSlider.step = 0.01;
    
    const juliaImagValue = document.createElement('span');
    juliaImagValue.className = 'slider-value';
    juliaImagValue.textContent = '0.27';
    
    juliaImagSlider.addEventListener('input', () => {
      juliaImagValue.textContent = juliaImagSlider.value;
      this.triggerCallback('onParameterChange', { 
        name: 'juliaImag', 
        value: parseFloat(juliaImagSlider.value)
      });
    });
    
    juliaImagContainer.appendChild(juliaImagLabel);
    
    const juliaImagSliderContainer = document.createElement('div');
    juliaImagSliderContainer.className = 'slider-container';
    juliaImagSliderContainer.appendChild(juliaImagSlider);
    juliaImagSliderContainer.appendChild(juliaImagValue);
    
    juliaImagContainer.appendChild(juliaImagSliderContainer);
    
    juliaContainer.appendChild(juliaLabel);
    juliaContainer.appendChild(juliaRealContainer);
    juliaContainer.appendChild(juliaImagContainer);
    
    controlsContainer.appendChild(juliaContainer);
    
    this.elements.controls['julia-real'] = juliaRealSlider;
    this.elements.controls['julia-imag'] = juliaImagSlider;
    
    // Color palette selector
    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'control-group';
    
    const paletteLabel = document.createElement('label');
    paletteLabel.textContent = 'Color Palette';
    paletteLabel.setAttribute('for', 'color-palette');
    
    const paletteSelect = document.createElement('select');
    paletteSelect.id = 'color-palette';
    paletteSelect.className = 'select-control';
    
    const palettes = [
      { value: 'spectral', text: 'Spectral' },
      { value: 'blues', text: 'Ocean Blues' },
      { value: 'fire', text: 'Fire' },
      { value: 'electric', text: 'Electric' },
      { value: 'pastel', text: 'Pastel' },
      { value: 'cosmic', text: 'Cosmic' },
      { value: 'quantum', text: 'Quantum' }
    ];
    
    palettes.forEach(palette => {
      const option = document.createElement('option');
      option.value = palette.value;
      option.textContent = palette.text;
      paletteSelect.appendChild(option);
    });
    
    paletteSelect.addEventListener('change', () => {
      this.triggerCallback('onParameterChange', { 
        name: 'colorPalette', 
        value: paletteSelect.value
      });
    });
    
    paletteContainer.appendChild(paletteLabel);
    paletteContainer.appendChild(paletteSelect);
    
    this.elements.controls['color-palette'] = paletteSelect;
    
    controlsContainer.appendChild(paletteContainer);
    
    // Add preset buttons
    const presetContainer = document.createElement('div');
    presetContainer.className = 'presets-container';
    
    const presetLabel = document.createElement('div');
    presetLabel.className = 'group-label';
    presetLabel.textContent = 'Presets';
    
    const presetsGrid = document.createElement('div');
    presetsGrid.className = 'presets-grid';
    
    const presets = [
      { id: 'classic', name: 'Classic' },
      { id: 'spiral', name: 'Spiral' },
      { id: 'deep-zoom', name: 'Deep Zoom' },
      { id: 'seahorse', name: 'Seahorse' },
      { id: 'dendrite', name: 'Dendrite' },
      { id: 'julia-islands', name: 'Julia Islands' }
    ];
    
    presets.forEach(preset => {
      const presetButton = document.createElement('button');
      presetButton.className = 'preset-button';
      presetButton.dataset.preset = preset.id;
      presetButton.textContent = preset.name;
      
      presetButton.addEventListener('click', () => {
        this.triggerCallback('onUIInteraction', { 
          type: 'preset',
          preset: preset.id
        });
      });
      
      presetsGrid.appendChild(presetButton);
    });
    
    presetContainer.appendChild(presetLabel);
    presetContainer.appendChild(presetsGrid);
    
    controlsContainer.appendChild(presetContainer);
    
    // Assemble fractal panel
    fractalPanel.appendChild(titleArea);
    fractalPanel.appendChild(controlsContainer);
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'ui-button back-button';
    backButton.textContent = 'Back to Main';
    backButton.addEventListener('click', () => this.showPanel('main'));
    
    fractalPanel.appendChild(backButton);
    
    // Add to container
    this.container.appendChild(fractalPanel);
    this.elements.panels['fractal'] = fractalPanel;
    
    return Promise.resolve();
  }
  
  /**
   * Create audio control panel
   * @returns {Promise} - Resolves when panel is created
   */
  async createAudioControls() {
    // Create audio panel
    const audioPanel = document.createElement('div');
    audioPanel.className = 'ui-panel audio-panel hidden';
    audioPanel.id = 'audio-panel';
    
    // Create title area
    const titleArea = document.createElement('div');
    titleArea.className = 'panel-title';
    
    const title = document.createElement('h2');
    title.textContent = 'Audio Controls';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.showPanel('main'));
    
    titleArea.appendChild(title);
    titleArea.appendChild(closeButton);
    
    // Create audio visualizer
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    visualizer.id = 'audio-visualizer';
    
    // Create 20 bars for the visualizer
    for (let i = 0; i < 20; i++) {
      const bar = document.createElement('div');
      bar.className = 'visualizer-bar';
      bar.style.height = '10%';
      visualizer.appendChild(bar);
    }
    
    // Create audio controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'panel-controls';
    
    // Volume control
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'control-group';
    
    const volumeLabel = document.createElement('label');
    volumeLabel.textContent = 'Volume';
    volumeLabel.setAttribute('for', 'volume-slider');
    
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'volume-slider';
    volumeSlider.className = 'slider-control';
    volumeSlider.min = 0;
    volumeSlider.max = 100;
    volumeSlider.value = 50;
    
    const volumeValue = document.createElement('span');
    volumeValue.className = 'slider-value';
    volumeValue.textContent = '50%';
    
    volumeSlider.addEventListener('input', () => {
      volumeValue.textContent = `${volumeSlider.value}%`;
      this.triggerCallback('onParameterChange', { 
        name: 'volume', 
        value: volumeSlider.value / 100
      });
    });
    
    volumeContainer.appendChild(volumeLabel);
    
    const volumeSliderContainer = document.createElement('div');
    volumeSliderContainer.className = 'slider-container';
    volumeSliderContainer.appendChild(volumeSlider);
    volumeSliderContainer.appendChild(volumeValue);
    
    volumeContainer.appendChild(volumeSliderContainer);
    
    this.elements.controls['volume-slider'] = volumeSlider;
    
    // Base frequency control
    const frequencyContainer = document.createElement('div');
    frequencyContainer.className = 'control-group';
    
    const frequencyLabel = document.createElement('label');
    frequencyLabel.textContent = 'Base Frequency (Hz)';
    frequencyLabel.setAttribute('for', 'frequency-slider');
    
    const frequencySlider = document.createElement('input');
    frequencySlider.type = 'range';
    frequencySlider.id = 'frequency-slider';
    frequencySlider.className = 'slider-control';
    frequencySlider.min = 20;
    frequencySlider.max = 880;
    frequencySlider.value = 432;
    frequencySlider.step = 1;
    
    const frequencyValue = document.createElement('span');
    frequencyValue.className = 'slider-value';
    frequencyValue.textContent = '432 Hz';
    
    frequencySlider.addEventListener('input', () => {
      frequencyValue.textContent = `${frequencySlider.value} Hz`;
      this.triggerCallback('onParameterChange', { 
        name: 'baseFrequency', 
        value: parseFloat(frequencySlider.value)
      });
    });
    
    frequencyContainer.appendChild(frequencyLabel);
    
    const frequencySliderContainer = document.createElement('div');
    frequencySliderContainer.className = 'slider-container';
    frequencySliderContainer.appendChild(frequencySlider);
    frequencySliderContainer.appendChild(frequencyValue);
    
    frequencyContainer.appendChild(frequencySliderContainer);
    
    this.elements.controls['frequency-slider'] = frequencySlider;
    
    // Binaural beat control
    const binauralContainer = document.createElement('div');
    binauralContainer.className = 'control-group';
    
    const binauralLabel = document.createElement('label');
    binauralLabel.textContent = 'Binaural Beat (Hz)';
    binauralLabel.setAttribute('for', 'binaural-slider');
    
    const binauralSlider = document.createElement('input');
    binauralSlider.type = 'range';
    binauralSlider.id = 'binaural-slider';
    binauralSlider.className = 'slider-control';
    binauralSlider.min = 0;
    binauralSlider.max = 20;
    binauralSlider.value = 7.83;
    binauralSlider.step = 0.01;
    
    const binauralValue = document.createElement('span');
    binauralValue.className = 'slider-value';
    binauralValue.textContent = '7.83 Hz';
    
    binauralSlider.addEventListener('input', () => {
      binauralValue.textContent = `${binauralSlider.value} Hz`;
      this.triggerCallback('onParameterChange', { 
        name: 'binauralBeat', 
        value: parseFloat(binauralSlider.value)
      });
    });
    
    binauralContainer.appendChild(binauralLabel);
    
    const binauralSliderContainer = document.createElement('div');
    binauralSliderContainer.className = 'slider-container';
    binauralSliderContainer.appendChild(binauralSlider);
    binauralSliderContainer.appendChild(binauralValue);
    
    binauralContainer.appendChild(binauralSliderContainer);
    
    this.elements.controls['binaural-slider'] = binauralSlider;
    
    // Tempo control
    const tempoContainer = document.createElement('div');
    tempoContainer.className = 'control-group';
    
    const tempoLabel = document.createElement('label');
    tempoLabel.textContent = 'Tempo (BPM)';
    tempoLabel.setAttribute('for', 'tempo-slider');
    
    const tempoSlider = document.createElement('input');
    tempoSlider.type = 'range';
    tempoSlider.id = 'tempo-slider';
    tempoSlider.className = 'slider-control';
    tempoSlider.min = 0;
    tempoSlider.max = 120;
    tempoSlider.value = 60;
    tempoSlider.step = 1;
    
    const tempoValue = document.createElement('span');
    tempoValue.className = 'slider-value';
    tempoValue.textContent = '60 BPM';
    
    tempoSlider.addEventListener('input', () => {
      tempoValue.textContent = `${tempoSlider.value} BPM`;
      this.triggerCallback('onParameterChange', { 
        name: 'tempo', 
        value: parseInt(tempoSlider.value, 10)
      });
    });
    
    tempoContainer.appendChild(tempoLabel);
    
    const tempoSliderContainer = document.createElement('div');
    tempoSliderContainer.className = 'slider-container';
    tempoSliderContainer.appendChild(tempoSlider);
    tempoSliderContainer.appendChild(tempoValue);
    
    tempoContainer.appendChild(tempoSliderContainer);
    
    this.elements.controls['tempo-slider'] = tempoSlider;
    
    // Reverb control
    const reverbContainer = document.createElement('div');
    reverbContainer.className = 'control-group';
    
    const reverbLabel = document.createElement('label');
    reverbLabel.textContent = 'Reverb';
    reverbLabel.setAttribute('for', 'reverb-slider');
    
    const reverbSlider = document.createElement('input');
    reverbSlider.type = 'range';
    reverbSlider.id = 'reverb-slider';
    reverbSlider.className = 'slider-control';
    reverbSlider.min = 0;
    reverbSlider.max = 100;
    reverbSlider.value = 30;
    
    const reverbValue = document.createElement('span');
    reverbValue.className = 'slider-value';
    reverbValue.textContent = '30%';
    
    reverbSlider.addEventListener('input', () => {
      reverbValue.textContent = `${reverbSlider.value}%`;
      this.triggerCallback('onParameterChange', { 
        name: 'reverbWet', 
        value: reverbSlider.value / 100
      });
    });
    
    reverbContainer.appendChild(reverbLabel);
    
    const reverbSliderContainer = document.createElement('div');
    reverbSliderContainer.className = 'slider-container';
    reverbSliderContainer.appendChild(reverbSlider);
    reverbSliderContainer.appendChild(reverbValue);
    
    reverbContainer.appendChild(reverbSliderContainer);
    
    this.elements.controls['reverb-slider'] = reverbSlider;
    
    // Sound preset selector
    const presetContainer = document.createElement('div');
    presetContainer.className = 'control-group';
    
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Sound Preset';
    presetLabel.setAttribute('for', 'sound-preset');
    
    const presetSelect = document.createElement('select');
    presetSelect.id = 'sound-preset';
    presetSelect.className = 'select-control';
    
    const presets = [
      { value: 'meditation', text: 'Meditation' },
      { value: 'ambient', text: 'Ambient Drone' },
      { value: 'cosmic', text: 'Cosmic Waves' },
      { value: 'crystal', text: 'Crystal Bowls' },
      { value: 'quantum', text: 'Quantum Fluctuations' },
      { value: 'harmonic', text: 'Harmonic Series' },
      { value: 'pulsing', text: 'Pulsing Rhythm' }
    ];
    
    presets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.value;
      option.textContent = preset.text;
      presetSelect.appendChild(option);
    });
    
    presetSelect.addEventListener('change', () => {
      this.triggerCallback('onUIInteraction', { 
        type: 'soundPreset', 
        preset: presetSelect.value 
      });
    });
    
    presetContainer.appendChild(presetLabel);
    presetContainer.appendChild(presetSelect);
    
    this.elements.controls['sound-preset'] = presetSelect;
    
    // Add all control groups to container
    controlsContainer.appendChild(volumeContainer);
    controlsContainer.appendChild(frequencyContainer);
    controlsContainer.appendChild(binauralContainer);
    controlsContainer.appendChild(tempoContainer);
    controlsContainer.appendChild(reverbContainer);
    controlsContainer.appendChild(presetContainer);
    
    // Assemble audio panel
    audioPanel.appendChild(titleArea);
    audioPanel.appendChild(visualizer);
    audioPanel.appendChild(controlsContainer);
    
    // Create mute button
    const muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.className = 'ui-button action-button';
    muteButton.textContent = 'Mute Audio';
    
    muteButton.addEventListener('click', () => {
      if (muteButton.classList.contains('active')) {
        muteButton.classList.remove('active');
        muteButton.textContent = 'Mute Audio';
        this.triggerCallback('onUIInteraction', { 
          type: 'button', 
          action: 'unmute' 
        });
      } else {
        muteButton.classList.add('active');
        muteButton.textContent = 'Unmute Audio';
        this.triggerCallback('onUIInteraction', { 
          type: 'button', 
          action: 'mute' 
        });
      }
    });
    
    this.elements.controls['mute-button'] = muteButton;
    
    // Create back button
    const backButton = document.createElement('button');
    backButton.className = 'ui-button back-button';
    backButton.textContent = 'Back to Main';
    backButton.addEventListener('click', () => this.showPanel('main'));
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(muteButton);
    buttonContainer.appendChild(backButton);
    
    audioPanel.appendChild(buttonContainer);
    
    // Add to container
    this.container.appendChild(audioPanel);
    this.elements.panels['audio'] = audioPanel;
    
    return Promise.resolve();
  }
  
  /**
   * Create information panel
   * @returns {Promise} - Resolves when panel is created
   */
  async createInfoPanel() {
    // Create info panel
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel hidden';
    infoPanel.id = 'info-panel';
    
    // Create title
    const infoTitle = document.createElement('h3');
    infoTitle.className = 'info-title';
    infoTitle.textContent = 'Fractal Information';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.toggleInfoVisibility(false));
    
    // Create info content
    const infoContent = document.createElement('div');
    infoContent.className = 'info-content';
    
    // Create fractal description
    const fractalDescription = document.createElement('p');
    fractalDescription.className = 'fractal-description';
    fractalDescription.id = 'fractal-description';
    fractalDescription.textContent = 'The Mandelbrot set is a famous fractal that exhibits infinite self-similarity. As you zoom in, new details and patterns continually emerge.';
    
    // Create coordinates display
    const coordinatesInfo = document.createElement('div');
    coordinatesInfo.className = 'coordinates-info';
    
    const centerLabel = document.createElement('span');
    centerLabel.className = 'info-label';
    centerLabel.textContent = 'Center: ';
    
    const centerValue = document.createElement('span');
    centerValue.className = 'info-value';
    centerValue.id = 'center-value';
    centerValue.textContent = '0, 0';
    
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'info-label';
    zoomLabel.textContent = 'Zoom: ';
    
    const zoomValue = document.createElement('span');
    zoomValue.className = 'info-value';
    zoomValue.id = 'zoom-value';
    zoomValue.textContent = '1x';
    
    coordinatesInfo.appendChild(centerLabel);
    coordinatesInfo.appendChild(centerValue);
    coordinatesInfo.appendChild(document.createElement('br'));
    coordinatesInfo.appendChild(zoomLabel);
    coordinatesInfo.appendChild(zoomValue);
    
    // Add help text
    const helpText = document.createElement('div');
    helpText.className = 'help-text';
    
    const helpTitle = document.createElement('h4');
    helpTitle.textContent = 'Navigation:';
    
    const helpList = document.createElement('ul');
    
    const helpItems = [
      'Mouse Drag: Pan the view',
      'Mouse Wheel: Zoom in/out',
      'Right Drag: Rotate',
      'Double Click: Zoom in at point',
      'R key: Reset view',
      '+ / - keys: Zoom in/out',
      'Arrow keys: Pan view'
    ];
    
    helpItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      helpList.appendChild(li);
    });
    
    helpText.appendChild(helpTitle);
    helpText.appendChild(helpList);
    
    // Assemble info panel
    infoContent.appendChild(fractalDescription);
    infoContent.appendChild(coordinatesInfo);
    infoContent.appendChild(helpText);
    
    infoPanel.appendChild(infoTitle);
    infoPanel.appendChild(closeButton);
    infoPanel.appendChild(infoContent);
    
    // Add to container
    this.container.appendChild(infoPanel);
    this.elements.info.panel = infoPanel;
    this.elements.info.description = fractalDescription;
    this.elements.info.center = centerValue;
    this.elements.info.zoom = zoomValue;
    
    return Promise.resolve();
  }
  
  /**
   * Create modal dialogs
   * @returns {Promise} - Resolves when modals are created
   */
  async createModals() {
    // Create AI Assistant modal
    const aiModal = document.createElement('div');
    aiModal.className = 'modal-overlay hidden';
    aiModal.id = 'ai-modal';
    
    const aiModalContent = document.createElement('div');
    aiModalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'AI Dreamscape Assistant';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.closeModal('ai-modal'));
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    const promptLabel = document.createElement('p');
    promptLabel.textContent = 'Describe what you would like to create or explore:';
    
    const promptInput = document.createElement('textarea');
    promptInput.className = 'ai-prompt';
    promptInput.id = 'ai-prompt';
    promptInput.rows = 3;
    promptInput.placeholder = 'e.g., "Create a deep blue fractal with slow pulsing sound that feels like diving into an ocean"';
    
    const aiResponse = document.createElement('div');
    aiResponse.className = 'ai-response hidden';
    aiResponse.id = 'ai-response';
    
    modalBody.appendChild(promptLabel);
    modalBody.appendChild(promptInput);
    modalBody.appendChild(aiResponse);
    
    // Create modal footer
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'ui-button primary-button';
    submitButton.textContent = 'Generate Experience';
    submitButton.addEventListener('click', () => {
      const prompt = promptInput.value.trim();
      if (prompt) {
        this.triggerCallback('onUIInteraction', { 
          type: 'aiPrompt', 
          prompt
        });
        
        // Show loading state
        aiResponse.textContent = 'Creating your experience...';
        aiResponse.classList.remove('hidden');
        submitButton.disabled = true;
        
        // This would be replaced with actual AI processing
        setTimeout(() => {
          submitButton.disabled = false;
        }, 2000);
      }
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'ui-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.closeModal('ai-modal'));
    
    modalFooter.appendChild(submitButton);
    modalFooter.appendChild(cancelButton);
    
    // Assemble modal
    aiModalContent.appendChild(modalHeader);
    aiModalContent.appendChild(modalBody);
    aiModalContent.appendChild(modalFooter);
    
    aiModal.appendChild(aiModalContent);
    
    // Add to container
    document.body.appendChild(aiModal);
    this.elements.modals['ai-modal'] = aiModal;
    
    return Promise.resolve();
  }
  
  /**
   * Add event listeners to system components
   */
  addEventListeners() {
    // Listen for window resize
    window.addEventListener('resize', this.handleResize);
    
    // Listen for fractal changes if fractal engine is available
    if (this.fractalEngine) {
      this.fractalEngine.addEventListener('onParameterChange', event => {
        this.updateControlValues(event);
      });
      
      this.fractalEngine.addEventListener('onFractalChange', event => {
        this.updateFractalInfo(event);
      });
    }
    
    // Listen for audio analysis if audio engine is available
    if (this.audioEngine) {
      this.audioEngine.addEventListener('onAnalysis', analysis => {
        this.updateAudioVisualizer(analysis);
      });
    }
  }
  
  /**
   * Start periodic info updates
   */
  startInfoUpdates() {
    if (this.state.infoUpdateInterval) {
      clearInterval(this.state.infoUpdateInterval);
    }
    
    // Update info every 500ms
    this.state.infoUpdateInterval = setInterval(() => {
      this.updatePerformanceInfo();
      this.updateCoordinateInfo();
    }, 500);
  }
  
  /**
   * Update control values from parameter change
   * @param {Object} event - Parameter change event
   */
  updateControlValues(event) {
    if (!event || !event.name) return;
    
    // Map parameter names to control IDs
    const controlMap = {
      iterations: 'iterations-slider',
      exponent: 'exponent-slider',
      colorShift: 'color-shift-slider',
      rotationAngle: 'rotation-slider',
      juliaReal: 'julia-real',
      juliaImag: 'julia-imag',
      volume: 'volume-slider',
      baseFrequency: 'frequency-slider',
      binauralBeat: 'binaural-slider',
      tempo: 'tempo-slider',
      reverbWet: 'reverb-slider'
    };
    
    const controlId = controlMap[event.name];
    if (controlId && this.elements.controls[controlId]) {
      const control = this.elements.controls[controlId];
      
      // Handle percentage values
      if (controlId === 'volume-slider' || controlId === 'reverb-slider') {
        control.value = event.value * 100;
        
        // Update value display if it exists
        const valueDisplay = control.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          valueDisplay.textContent = `${Math.round(event.value * 100)}%`;
        }
      } else {
        control.value = event.value;
        
        // Update value display if it exists
        const valueDisplay = control.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          // Format display based on control type
          if (controlId === 'frequency-slider') {
            valueDisplay.textContent = `${event.value} Hz`;
          } else if (controlId === 'binaural-slider') {
            valueDisplay.textContent = `${event.value} Hz`;
          } else if (controlId === 'tempo-slider') {
            valueDisplay.textContent = `${event.value} BPM`;
          } else {
            valueDisplay.textContent = event.value;
          }
        }
      }
    }
    
    // Special case for fractal type
    if (event.name === 'type' && this.elements.controls['fractal-type']) {
      this.elements.controls['fractal-type'].value = event.value;
      
      // Show/hide Julia controls
      const juliaControls = document.getElementById('julia-controls');
      if (juliaControls) {
        if (event.value === 'julia') {
          juliaControls.classList.remove('hidden');
        } else {
          juliaControls.classList.add('hidden');
        }
      }
    }
  }
  
  /**
   * Update fractal information
   * @param {Object} event - Fractal change event
   */
  updateFractalInfo(event) {
    if (!this.elements.info.description) return;
    
    // Update fractal description based on type
    switch (event.type || event.current) {
      case 'mandelbrot':
        this.elements.info.description.textContent = 
          'The Mandelbrot set is one of the most famous fractals, discovered by Benoît Mandelbrot. ' +
          'It exhibits infinite self-similarity - zooming in reveals patterns similar to the whole.';
        break;
      case 'julia':
        this.elements.info.description.textContent = 
          'Julia sets are related to the Mandelbrot set, but each point in the Mandelbrot set ' +
          'corresponds to a different Julia set. They create beautiful, interconnected patterns.';
        break;
      case 'burningShip':
        this.elements.info.description.textContent = 
          'The Burning Ship fractal resembles a burning ship when viewed from a distance. ' +
          'Its created by taking absolute values of real and imaginary parts in each iteration.';
        break;
      case 'mandelbulb':
        this.elements.info.description.textContent = 
          'The Mandelbulb is a 3D analog of the Mandelbrot set. It creates complex 3D structures ' +
          'with intricate details that twist and fold through space.';
        break;
      case 'hyperbolic':
        this.elements.info.description.textContent = 
          'Hyperbolic tilings visualize non-Euclidean geometry, where parallel lines diverge. ' +
          'These patterns tile the hyperbolic plane with regular polygons in ways impossible in flat space.';
        break;
    }
    
    // Show/hide Julia controls based on fractal type
    const juliaControls = document.getElementById('julia-controls');
    if (juliaControls) {
      if ((event.type || event.current) === 'julia') {
        juliaControls.classList.remove('hidden');
      } else {
        juliaControls.classList.add('hidden');
      }
    }
  }
  
  /**
   * Update coordinate information
   */
  updateCoordinateInfo() {
    if (!this.fractalEngine || !this.elements.info.center || !this.elements.info.zoom) return;
    
    const parameters = this.fractalEngine.parameters;
    if (!parameters) return;
    
    // Update center coordinates
    this.elements.info.center.textContent = 
      `${parameters.centerX.toFixed(6)}, ${parameters.centerY.toFixed(6)}`;
    
    // Update zoom level
    this.elements.info.zoom.textContent = `${parameters.zoom.toExponential(2)}×`;
  }
  
  /**
   * Update performance information
   */
  updatePerformanceInfo() {
    if (!this.elements.info.performance) return;
    
    // Get performance metrics
    const fps = this.fractalEngine ? this.fractalEngine.metrics.fps : 0;
    const renderTime = this.fractalEngine ? this.fractalEngine.metrics.renderTime : 0;
    
    // Update display
    this.elements.info.performance.innerHTML = `
      <span class="fps">FPS: ${fps}</span>
      <span class="render-time">Render: ${renderTime ? renderTime.toFixed(2) : 0} ms</span>
    `;
  }
  
  /**
   * Update audio visualizer with analysis data
   * @param {Object} analysis - Audio analysis data
   */
  updateAudioVisualizer(analysis) {
    const visualizer = document.getElementById('audio-visualizer');
    if (!visualizer) return;
    
    const bars = visualizer.querySelectorAll('.visualizer-bar');
    if (!bars.length) return;
    
    // Get frequency data for visualization
    const spectrum = analysis.spectrum || [];
    
    // If we have spectrum data, update the bars
    if (spectrum.length) {
      // Use a subset of the spectrum data to match bar count
      const step = Math.floor(spectrum.length / bars.length);
      
      for (let i = 0; i < bars.length; i++) {
        const index = i * step;
        if (index < spectrum.length) {
          // Normalize value to 0-100 for bar height
          const value = spectrum[index] / 255 * 100;
          
          // Update bar height with animation
          bars[i].style.height = `${value}%`;
          
          // Generate color based on frequency
          const hue = (i / bars.length) * 240; // 0-240 (blue to red)
          bars[i].style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        }
      }
    } else {
      // No spectrum data, simulate visualization with random values
      for (let i = 0; i < bars.length; i++) {
        const value = 5 + Math.random() * 30; // Random height 5-35%
        bars[i].style.height = `${value}%`;
      }
    }
  }
  
  /**
   * Start the UI controller
   */
  start() {
    this.isActive = true;
    
    // Show UI
    this.container.classList.remove('hidden');
    
    // Start info updates
    this.startInfoUpdates();
  }
  
  /**
   * Stop the UI controller
   */
  stop() {
    this.isActive = false;
    
    // Hide UI
    this.container.classList.add('hidden');
    
    // Stop info updates
    if (this.state.infoUpdateInterval) {
      clearInterval(this.state.infoUpdateInterval);
      this.state.infoUpdateInterval = null;
    }
  }
  
  /**
   * Show a specific panel
   * @param {string} panelId - Panel ID to show
   */
  showPanel(panelId) {
    // Hide all panels
    Object.values(this.elements.panels).forEach(panel => {
      panel.classList.add('hidden');
    });
    
    // Show selected panel
    if (this.elements.panels[panelId]) {
      this.elements.panels[panelId].classList.remove('hidden');
      this.state.activePanel = panelId;
      
      // Trigger UI interaction event
      this.triggerCallback('onUIInteraction', {
        type: 'panelChange',
        panel: panelId
      });
    }
  }
  
  /**
   * Toggle controls visibility
   * @param {boolean} visible - Whether controls should be visible
   */
  toggleControlsVisibility(visible) {
    this.state.isControlsVisible = visible !== undefined ? visible : !this.state.isControlsVisible;
    
    if (this.state.isControlsVisible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }
  
  /**
   * Toggle info panel visibility
   * @param {boolean} visible - Whether info panel should be visible
   */
  toggleInfoVisibility(visible) {
    this.state.isInfoVisible = visible !== undefined ? visible : !this.state.isInfoVisible;
    
    if (this.state.isInfoVisible) {
      this.elements.info.panel.classList.remove('hidden');
    } else {
      this.elements.info.panel.classList.add('hidden');
    }
    
    // Trigger UI interaction event
    this.triggerCallback('onUIInteraction', {
      type: 'infoToggle',
      visible: this.state.isInfoVisible
    });
  }
  
  /**
   * Open AI modal
   */
  openAIModal() {
    const modal = this.elements.modals['ai-modal'];
    if (modal) {
      modal.classList.remove('hidden');
      this.state.activeModal = 'ai-modal';
      
      // Focus on prompt input
      const promptInput = document.getElementById('ai-prompt');
      if (promptInput) {
        promptInput.focus();
      }
      
      // Hide any previous response
      const aiResponse = document.getElementById('ai-response');
      if (aiResponse) {
        aiResponse.classList.add('hidden');
      }
      
      // Trigger UI interaction event
      this.triggerCallback('onUIInteraction', {
        type: 'modalOpen',
        modal: 'ai-modal'
      });
    }
  }
  
  /**
   * Close modal
   * @param {string} modalId - Modal ID to close
   */
  closeModal(modalId) {
    const modal = this.elements.modals[modalId];
    if (modal) {
      modal.classList.add('hidden');
      this.state.activeModal = null;
      
      // Trigger UI interaction event
      this.triggerCallback('onUIInteraction', {
        type: 'modalClose',
        modal: modalId
      });
    }
  }
  
  /**
   * Show a prompt or notification
   * @param {Object} options - Prompt options
   */
  showPrompt(options = {}) {
    const text = options.text || options;
    const duration = options.duration || 5000;
    const type = options.type || 'info';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${text}</span>`;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      notification.classList.add('hiding');
      setTimeout(() => {
        notification.remove();
        
        // Remove from tracking array
        const index = this.state.notifications.indexOf(notification);
        if (index !== -1) {
          this.state.notifications.splice(index, 1);
        }
      }, 300); // Animation duration
    });
    
    notification.appendChild(closeButton);
    
    // Add to container
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Add to tracking array
    this.state.notifications.push(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
          notification.remove();
          
          // Remove from tracking array
          const index = this.state.notifications.indexOf(notification);
          if (index !== -1) {
            this.state.notifications.splice(index, 1);
          }
        }, 300); // Animation duration
      }, duration);
    }
  }
  
  /**
   * Process an AI response
   * @param {Object} response - AI response data
   */
  processAIResponse(response) {
    const aiResponse = document.getElementById('ai-response');
    if (!aiResponse) return;
    
    // Show response
    aiResponse.textContent = response.interpretation || response.message;
    aiResponse.classList.remove('hidden');
    
    // Automatically close modal after a delay if response was successful
    if (response.success) {
      setTimeout(() => {
        this.closeModal('ai-modal');
      }, 3000);
    }
  }
  
  /**
   * Highlight a UI element
   * @param {string} elementId - Element ID to highlight
   * @param {Object} options - Highlight options
   */
  highlightElement(elementId, options = {}) {
    const element = document.getElementById(elementId) || this.elements.controls[elementId];
    if (!element) return;
    
    // Remove highlight from previous element
    if (this.state.highlightedElement) {
      this.state.highlightedElement.classList.remove('highlighted');
    }
    
    // Add highlight to new element
    element.classList.add('highlighted');
    this.state.highlightedElement = element;
    
    // Auto-remove highlight after duration
    const duration = options.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        element.classList.remove('highlighted');
        if (this.state.highlightedElement === element) {
          this.state.highlightedElement = null;
        }
      }, duration);
    }
  }
  
  /**
   * Set the UI theme
   * @param {string} theme - Theme name
   */
  setTheme(theme) {
    // Remove any existing theme classes
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-cosmic');
    
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
  }
  
  /**
   * Apply a preset to UI controls
   * @param {Object} preset - Preset configuration
   */
  applyPresetToUI(preset) {
    if (!preset) return;
    
    // Update fractal type if specified
    if (preset.fractalType && this.elements.controls['fractal-type']) {
      this.elements.controls['fractal-type'].value = preset.fractalType;
    }
    
    // Update parameter controls
    if (preset.parameters) {
      Object.entries(preset.parameters).forEach(([name, value]) => {
        // Map parameter names to control IDs
        const controlMap = {
          iterations: 'iterations-slider',
          exponent: 'exponent-slider',
          colorShift: 'color-shift-slider',
          rotationAngle: 'rotation-slider',
          juliaReal: 'julia-real',
          juliaImag: 'julia-imag',
          baseFrequency: 'frequency-slider',
          binauralBeat: 'binaural-slider',
          tempo: 'tempo-slider'
        };
        
        const controlId = controlMap[name];
        if (controlId && this.elements.controls[controlId]) {
          this.elements.controls[controlId].value = value;
          
          // Update value display if it exists
          const valueDisplay = this.elements.controls[controlId].parentElement.querySelector('.slider-value');
          if (valueDisplay) {
            valueDisplay.textContent = value;
          }
        }
      });
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // No specific action needed for now
    // UI should adapt with CSS, but we might need logic for specific cases
  }
  
  /**
   * Register a callback for UI events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  registerCallback(event, callback) {
    if (this.callbacks[event] && typeof callback === 'function') {
      this.callbacks[event].push(callback);
    }
  }
  
  /**
   * Unregister a callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  unregisterCallback(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }
  
  /**
   * Trigger registered callbacks for an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in UI callback for ${event}:`, error);
        }
      });
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Stop info updates
    if (this.state.infoUpdateInterval) {
      clearInterval(this.state.infoUpdateInterval);
      this.state.infoUpdateInterval = null;
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Remove all notifications
    this.state.notifications.forEach(notification => {
      notification.remove();
    });
    this.state.notifications = [];
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Remove modals
    Object.values(this.elements.modals).forEach(modal => {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    
    // Clear references
    this.elements = {
      controls: {},
      panels: {},
      info: {},
      modals: {}
    };
    
    this.isInitialized = false;
    this.isActive = false;
    
    console.log('UI Controller disposed');
  }
}

export default UIController;