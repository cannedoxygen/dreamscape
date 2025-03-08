/**
 * InputHandler.js
 * 
 * Manages and processes all user input interactions with the system.
 * Handles mouse, keyboard, touch, and other input events and translates
 * them into meaningful interactions for other components.
 */

import { Performance } from '../utils/Performance';

export class InputHandler {
  /**
   * Initialize the InputHandler
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = options.config || {};
    this.fractalEngine = options.fractalEngine;
    this.audioEngine = options.audioEngine;
    
    // Interaction state
    this.isActive = false;
    this.isDragging = false;
    this.isZooming = false;
    this.isPanning = false;
    this.isRotating = false;
    
    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      button: -1,
      downX: 0,
      downY: 0,
      downTime: 0
    };
    
    // Touch state
    this.touches = [];
    this.pinchDistance = 0;
    this.pinchCenter = { x: 0, y: 0 };
    
    // Keyboard state
    this.keys = new Set();
    
    // Map DOM elements to interaction handlers
    this.interactionMap = new Map();
    
    // Event callbacks
    this.eventHandlers = {
      interaction: [],
      dragStart: [],
      dragMove: [],
      dragEnd: [],
      zoom: [],
      pan: [],
      rotate: [],
      keypress: []
    };
    
    // Bind methods to ensure 'this' context
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
  }
  
  /**
   * Initialize the input handler
   * @returns {boolean} - Success status
   */
  initialize() {
    console.log('Initializing InputHandler...');
    
    // Set default configuration
    this.updateFromConfig();
    
    // Attach event listeners if DOM is available
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.attachEventListeners();
    } else {
      console.warn('InputHandler initialized in non-browser environment');
    }
    
    console.log('InputHandler initialized');
    return true;
  }
  
  /**
   * Update from configuration
   */
  updateFromConfig() {
    if (!this.config) return;
    
    // Apply configuration options
    if (this.config.dragThreshold) this.dragThreshold = this.config.dragThreshold;
    if (this.config.zoomSpeed) this.zoomSpeed = this.config.zoomSpeed;
    if (this.config.panSpeed) this.panSpeed = this.config.panSpeed;
    if (this.config.rotateSpeed) this.rotateSpeed = this.config.rotateSpeed;
    
    // Set defaults if not provided
    this.dragThreshold = this.dragThreshold || 3;
    this.zoomSpeed = this.zoomSpeed || 1.0;
    this.panSpeed = this.panSpeed || 1.0;
    this.rotateSpeed = this.rotateSpeed || 0.01;
  }
  
  /**
   * Attach event listeners to DOM elements
   */
  attachEventListeners() {
    // Get canvas element
    const canvas = this.fractalEngine ? 
      this.fractalEngine.threeRenderer?.domElement : 
      document.querySelector('canvas');
    
    if (canvas) {
      // Mouse events
      canvas.addEventListener('mousedown', this.onMouseDown);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      canvas.addEventListener('wheel', this.onMouseWheel, { passive: false });
      
      // Touch events
      canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
      window.addEventListener('touchmove', this.onTouchMove, { passive: false });
      window.addEventListener('touchend', this.onTouchEnd);
      
      // Prevent context menu on right-click
      canvas.addEventListener('contextmenu', this.onContextMenu);
    }
    
    // Keyboard events
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    
    // Prevent scrolling on touch devices
    document.body.addEventListener('touchmove', (e) => {
      if (this.isActive) {
        e.preventDefault();
      }
    }, { passive: false });
  }
  
  /**
   * Start the input handler
   */
  start() {
    this.isActive = true;
  }
  
  /**
   * Stop the input handler
   */
  stop() {
    this.isActive = false;
    this.resetState();
  }
  
  /**
   * Reset all input state
   */
  resetState() {
    this.isDragging = false;
    this.isZooming = false;
    this.isPanning = false;
    this.isRotating = false;
    this.mouse = {
      x: 0, y: 0, prevX: 0, prevY: 0, button: -1,
      downX: 0, downY: 0, downTime: 0
    };
    this.touches = [];
    this.pinchDistance = 0;
    this.pinchCenter = { x: 0, y: 0 };
    this.keys.clear();
  }
  
  /**
   * Map a DOM element to an interaction handler
   * @param {HTMLElement} element - DOM element
   * @param {Function} handler - Interaction handler function
   * @param {string} eventType - Event type to handle
   */
  mapInteraction(element, handler, eventType = 'click') {
    if (!element || !handler) return;
    
    const key = `${element.id || 'anonymous'}-${eventType}`;
    this.interactionMap.set(key, { element, handler, eventType });
    
    element.addEventListener(eventType, (e) => {
      if (!this.isActive) return;
      
      handler(e);
      
      // Create interaction event
      const interaction = {
        type: 'ui',
        subtype: eventType,
        elementId: element.id || 'anonymous',
        timestamp: Date.now(),
        position: { x: e.clientX, y: e.clientY }
      };
      
      // Dispatch interaction event
      this.dispatchEvent('interaction', interaction);
    });
  }
  
  /**
   * Handle mouse down event
   * @param {MouseEvent} event - Mouse event
   */
  onMouseDown(event) {
    if (!this.isActive) return;
    
    Performance.mark('input-mousedown-start');
    
    // Update mouse state
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    this.mouse.button = event.button;
    this.mouse.downX = event.clientX;
    this.mouse.downY = event.clientY;
    this.mouse.downTime = Date.now();
    
    // Set appropriate interaction flags
    if (event.button === 0) { // Left button
      if (event.shiftKey) {
        this.isPanning = true;
      } else if (event.ctrlKey || event.altKey) {
        this.isRotating = true;
      } else {
        this.isDragging = true;
      }
    } else if (event.button === 1) { // Middle button
      this.isPanning = true;
    } else if (event.button === 2) { // Right button
      this.isRotating = true;
    }
    
    // Create interaction event
    const interaction = {
      type: 'mouseDown',
      button: event.button,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      },
      position: { x: event.clientX, y: event.clientY },
      timestamp: Date.now()
    };
    
    // Dispatch event
    this.dispatchEvent('interaction', interaction);
    
    Performance.mark('input-mousedown-end');
    Performance.measure('input-mousedown', 'input-mousedown-start', 'input-mousedown-end');
  }
  
  /**
   * Handle mouse move event
   * @param {MouseEvent} event - Mouse event
   */
  onMouseMove(event) {
    if (!this.isActive) return;
    
    // Store previous position
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    
    // Update current position
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
    
    // Calculate deltas
    const deltaX = this.mouse.x - this.mouse.prevX;
    const deltaY = this.mouse.y - this.mouse.prevY;
    
    // Check if we're dragging/panning/rotating
    if (this.isDragging) {
      this.handleDrag(deltaX, deltaY, event);
    } else if (this.isPanning) {
      this.handlePan(deltaX, deltaY, event);
    } else if (this.isRotating) {
      this.handleRotate(deltaX, deltaY, event);
    }
    
    // Create interaction event for significant movements
    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
      const interaction = {
        type: 'mouseMove',
        delta: { x: deltaX, y: deltaY },
        position: { x: event.clientX, y: event.clientY },
        isDragging: this.isDragging,
        isPanning: this.isPanning,
        isRotating: this.isRotating,
        timestamp: Date.now()
      };
      
      this.dispatchEvent('interaction', interaction);
    }
  }
  
  /**
   * Handle mouse up event
   * @param {MouseEvent} event - Mouse event
   */
  onMouseUp(event) {
    if (!this.isActive) return;
    
    // Check if we were dragging/panning/rotating
    const wasDragging = this.isDragging;
    const wasPanning = this.isPanning;
    const wasRotating = this.isRotating;
    
    // Reset interaction flags
    this.isDragging = false;
    this.isPanning = false;
    this.isRotating = false;
    
    // Calculate total movement
    const totalDeltaX = event.clientX - this.mouse.downX;
    const totalDeltaY = event.clientY - this.mouse.downY;
    const movementDistance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
    
    // Calculate interaction duration
    const duration = Date.now() - this.mouse.downTime;
    
    // Check if this was a click (minimal movement)
    const isClick = movementDistance < this.dragThreshold;
    
    // Create appropriate interaction event
    let interaction;
    
    if (isClick) {
      // This was a click
      interaction = {
        type: 'click',
        button: this.mouse.button,
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      };
      
      // Handle click in fractal (could be used to zoom in or change parameters)
      if (this.fractalEngine && this.mouse.button === 0) {
        this.handleFractalClick(event.clientX, event.clientY);
      }
    } else {
      // This was a drag/pan/rotate end
      interaction = {
        type: wasDragging ? 'dragEnd' : (wasPanning ? 'panEnd' : 'rotateEnd'),
        button: this.mouse.button,
        totalDelta: { x: totalDeltaX, y: totalDeltaY },
        duration: duration,
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      };
      
      // Dispatch specific event
      if (wasDragging) {
        this.dispatchEvent('dragEnd', interaction);
      } else if (wasPanning) {
        this.dispatchEvent('pan', { 
          deltaX: totalDeltaX, 
          deltaY: totalDeltaY,
          duration
        });
      } else if (wasRotating) {
        this.dispatchEvent('rotate', { 
          deltaX: totalDeltaX, 
          deltaY: totalDeltaY,
          duration
        });
      }
    }
    
    // Dispatch generic interaction event
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Handle mouse wheel event
   * @param {WheelEvent} event - Wheel event
   */
  onMouseWheel(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    
    Performance.mark('input-wheel-start');
    
    // Normalize wheel delta (Firefox uses different values)
    const delta = event.deltaY || -event.detail || 0;
    const zoomDelta = -Math.sign(delta) * this.zoomSpeed;
    
    // Apply zoom to fractal
    if (this.fractalEngine) {
      // Convert screen coordinates to fractal coordinates
      const fractalCoords = this.fractalEngine.renderers[this.fractalEngine.activeRenderer]
        .screenToFractalCoordinates(event.clientX, event.clientY);
      
      // Calculate new zoom
      const currentZoom = this.fractalEngine.parameters.zoom;
      const zoomFactor = Math.exp(zoomDelta * 0.2); // Smoother zoom
      const newZoom = currentZoom * zoomFactor;
      
      // Apply zoom
      this.fractalEngine.setParameter('zoom', newZoom);
      
      // If zooming in, adjust center to zoom toward mouse position
      if (zoomDelta > 0) {
        const currentCenterX = this.fractalEngine.parameters.centerX;
        const currentCenterY = this.fractalEngine.parameters.centerY;
        
        // Move center slightly toward mouse position
        const adjustmentFactor = 0.1; // How much to adjust center (0.5 would center exactly on mouse)
        const newCenterX = currentCenterX + (fractalCoords.x - currentCenterX) * adjustmentFactor;
        const newCenterY = currentCenterY + (fractalCoords.y - currentCenterY) * adjustmentFactor;
        
        this.fractalEngine.setParameter('centerX', newCenterX);
        this.fractalEngine.setParameter('centerY', newCenterY);
      }
    }
    
    // Create zoom interaction event
    const interaction = {
      type: 'zoom',
      delta: zoomDelta,
      position: { x: event.clientX, y: event.clientY },
      timestamp: Date.now()
    };
    
    // Dispatch events
    this.dispatchEvent('zoom', { delta: zoomDelta, x: event.clientX, y: event.clientY });
    this.dispatchEvent('interaction', interaction);
    
    Performance.mark('input-wheel-end');
    Performance.measure('input-wheel', 'input-wheel-start', 'input-wheel-end');
  }
  
  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  onTouchStart(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    
    // Store touch points
    this.touches = Array.from(event.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    }));
    
    // Set appropriate interaction mode based on touch count
    if (this.touches.length === 1) {
      // Single touch - drag/pan
      this.isDragging = true;
      this.mouse.downX = this.touches[0].x;
      this.mouse.downY = this.touches[0].y;
      this.mouse.downTime = Date.now();
    } else if (this.touches.length === 2) {
      // Two touches - pinch zoom and/or rotation
      this.isZooming = true;
      this.isPanning = true;
      
      // Calculate initial pinch distance and center
      const dx = this.touches[1].x - this.touches[0].x;
      const dy = this.touches[1].y - this.touches[0].y;
      this.pinchDistance = Math.sqrt(dx * dx + dy * dy);
      this.pinchCenter = {
        x: (this.touches[0].x + this.touches[1].x) / 2,
        y: (this.touches[0].y + this.touches[1].y) / 2
      };
    } else if (this.touches.length === 3) {
      // Three touches - special action like reset or mode switch
      this.isRotating = true;
    }
    
    // Create touch interaction event
    const interaction = {
      type: 'touchStart',
      touchCount: this.touches.length,
      positions: this.touches.map(t => ({ x: t.x, y: t.y })),
      timestamp: Date.now()
    };
    
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  onTouchMove(event) {
    if (!this.isActive) return;
    
    event.preventDefault();
    
    // Update touch points
    const currentTouches = Array.from(event.touches);
    
    // Map current touches to existing tracked touches
    for (const touch of currentTouches) {
      const existingTouch = this.touches.find(t => t.id === touch.identifier);
      if (existingTouch) {
        existingTouch.prevX = existingTouch.x;
        existingTouch.prevY = existingTouch.y;
        existingTouch.x = touch.clientX;
        existingTouch.y = touch.clientY;
      }
    }
    
    // Handle different touch gestures
    if (this.touches.length === 1 && this.isDragging) {
      // Single touch drag/pan
      const touch = this.touches[0];
      const deltaX = touch.x - touch.prevX;
      const deltaY = touch.y - touch.prevY;
      
      this.handlePan(deltaX, deltaY, event);
    } else if (this.touches.length === 2 && this.isZooming) {
      // Two touch pinch/zoom and pan
      const touch1 = this.touches[0];
      const touch2 = this.touches[1];
      
      // Calculate new pinch distance
      const dx = touch2.x - touch1.x;
      const dy = touch2.y - touch1.y;
      const newPinchDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate new pinch center
      const newPinchCenter = {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2
      };
      
      // Calculate zoom and pan
      const zoomFactor = newPinchDistance / this.pinchDistance;
      const pinchDeltaX = newPinchCenter.x - this.pinchCenter.x;
      const pinchDeltaY = newPinchCenter.y - this.pinchCenter.y;
      
      // Apply zoom
      if (Math.abs(Math.log(zoomFactor)) > 0.01) { // Small threshold to avoid micro-zooms
        this.handleZoom(zoomFactor, newPinchCenter.x, newPinchCenter.y);
      }
      
      // Apply pan
      if (Math.abs(pinchDeltaX) > 1 || Math.abs(pinchDeltaY) > 1) {
        this.handlePan(pinchDeltaX, pinchDeltaY, event);
      }
      
      // Store new pinch values
      this.pinchDistance = newPinchDistance;
      this.pinchCenter = newPinchCenter;
    } else if (this.touches.length === 3 && this.isRotating) {
      // Three touch rotation
      const touch1 = this.touches[0];
      const touch3 = this.touches[2];
      
      const deltaX = (touch3.x - touch3.prevX) - (touch1.x - touch1.prevX);
      const deltaY = (touch3.y - touch3.prevY) - (touch1.y - touch1.prevY);
      
      this.handleRotate(deltaX, deltaY, event);
    }
    
    // Create touch movement interaction event
    const interaction = {
      type: 'touchMove',
      touchCount: this.touches.length,
      positions: this.touches.map(t => ({ x: t.x, y: t.y })),
      deltas: this.touches.map(t => ({ x: t.x - t.prevX, y: t.y - t.prevY })),
      isDragging: this.isDragging,
      isZooming: this.isZooming,
      isPanning: this.isPanning,
      isRotating: this.isRotating,
      timestamp: Date.now()
    };
    
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch event
   */
  onTouchEnd(event) {
    if (!this.isActive) return;
    
    // Find touches that were removed
    const currentTouchIds = Array.from(event.touches).map(t => t.identifier);
    const removedTouches = this.touches.filter(t => !currentTouchIds.includes(t.id));
    
    // Update touch points
    this.touches = Array.from(event.touches).map(touch => {
      const existingTouch = this.touches.find(t => t.id === touch.identifier);
      if (existingTouch) {
        return {
          ...existingTouch,
          x: touch.clientX,
          y: touch.clientY
        };
      } else {
        return {
          id: touch.identifier,
          x: touch.clientX,
          y: touch.clientY,
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now()
        };
      }
    });
    
    // Check for tap (quick touch and release with minimal movement)
    if (removedTouches.length === 1 && this.touches.length === 0) {
      const touch = removedTouches[0];
      const dx = touch.x - touch.startX;
      const dy = touch.y - touch.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - touch.startTime;
      
      if (distance < this.dragThreshold && duration < 300) {
        // This was a tap
        this.handleFractalClick(touch.x, touch.y);
        
        // Create tap interaction event
        const interaction = {
          type: 'tap',
          position: { x: touch.x, y: touch.y },
          timestamp: Date.now()
        };
        
        this.dispatchEvent('interaction', interaction);
      }
    }
    
    // Reset interaction flags if no touches remain
    if (this.touches.length === 0) {
      this.isDragging = false;
      this.isZooming = false;
      this.isPanning = false;
      this.isRotating = false;
    } else if (this.touches.length === 1) {
      // If we still have one touch, switch to dragging mode
      this.isDragging = true;
      this.isZooming = false;
      this.isPanning = false;
      this.isRotating = false;
    } else if (this.touches.length === 2) {
      // If we still have two touches, switch to zooming mode
      this.isDragging = false;
      this.isZooming = true;
      this.isPanning = true;
      this.isRotating = false;
      
      // Recalculate pinch distance and center
      const dx = this.touches[1].x - this.touches[0].x;
      const dy = this.touches[1].y - this.touches[0].y;
      this.pinchDistance = Math.sqrt(dx * dx + dy * dy);
      this.pinchCenter = {
        x: (this.touches[0].x + this.touches[1].x) / 2,
        y: (this.touches[0].y + this.touches[1].y) / 2
      };
    }
    
    // Create touch end interaction event
    const interaction = {
      type: 'touchEnd',
      touchCount: this.touches.length,
      positions: this.touches.map(t => ({ x: t.x, y: t.y })),
      removedTouches: removedTouches.map(t => ({
        x: t.x,
        y: t.y,
        dx: t.x - t.startX,
        dy: t.y - t.startY,
        duration: Date.now() - t.startTime
      })),
      timestamp: Date.now()
    };
    
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Handle key down event
   * @param {KeyboardEvent} event - Keyboard event
   */
  onKeyDown(event) {
    if (!this.isActive) return;
    
    // Store key state
    this.keys.add(event.key.toLowerCase());
    
    // Create key interaction event
    const interaction = {
      type: 'keyDown',
      key: event.key,
      code: event.code,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      timestamp: Date.now()
    };
    
    // Handle specific key commands
    switch (event.key.toLowerCase()) {
      case 'r':
        // Reset view
        if (this.fractalEngine) {
          this.fractalEngine.setParameters({
            centerX: 0,
            centerY: 0,
            zoom: 1,
            rotationAngle: 0
          });
        }
        break;
        
      case '+':
      case '=':
        // Zoom in
        if (this.fractalEngine) {
          const currentZoom = this.fractalEngine.parameters.zoom;
          this.fractalEngine.setParameter('zoom', currentZoom * 1.5);
        }
        break;
        
      case '-':
      case '_':
        // Zoom out
        if (this.fractalEngine) {
          const currentZoom = this.fractalEngine.parameters.zoom;
          this.fractalEngine.setParameter('zoom', currentZoom / 1.5);
        }
        break;
        
      case 'arrowup':
        // Pan up
        if (this.fractalEngine) {
          const currentY = this.fractalEngine.parameters.centerY;
          this.fractalEngine.setParameter('centerY', currentY - 0.1 / this.fractalEngine.parameters.zoom);
        }
        break;
        
      case 'arrowdown':
        // Pan down
        if (this.fractalEngine) {
          const currentY = this.fractalEngine.parameters.centerY;
          this.fractalEngine.setParameter('centerY', currentY + 0.1 / this.fractalEngine.parameters.zoom);
        }
        break;
        
      case 'arrowleft':
        // Pan left
        if (this.fractalEngine) {
          const currentX = this.fractalEngine.parameters.centerX;
          this.fractalEngine.setParameter('centerX', currentX - 0.1 / this.fractalEngine.parameters.zoom);
        }
        break;
        
      case 'arrowright':
        // Pan right
        if (this.fractalEngine) {
          const currentX = this.fractalEngine.parameters.centerX;
          this.fractalEngine.setParameter('centerX', currentX + 0.1 / this.fractalEngine.parameters.zoom);
        }
        break;
        
      case 'm':
        // Toggle Mandelbrot/Julia sets
        if (this.fractalEngine) {
          const currentType = this.fractalEngine.activeRenderer;
          if (currentType === 'mandelbrot') {
            this.fractalEngine.setFractalType('julia');
          } else if (currentType === 'julia') {
            this.fractalEngine.setFractalType('mandelbrot');
          }
        }
        break;
        
      case 's':
        // Take screenshot
        if (this.fractalEngine && typeof this.fractalEngine.takeScreenshot === 'function') {
          const screenshot = this.fractalEngine.takeScreenshot();
          
          // Create a download link
          const link = document.createElement('a');
          link.href = screenshot;
          link.download = `fractal-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
    }
    
    // Dispatch events
    this.dispatchEvent('keypress', {
      key: event.key,
      down: true,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    });
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Handle key up event
   * @param {KeyboardEvent} event - Keyboard event
   */
  onKeyUp(event) {
    if (!this.isActive) return;
    
    // Update key state
    this.keys.delete(event.key.toLowerCase());
    
    // Create key interaction event
    const interaction = {
      type: 'keyUp',
      key: event.key,
      code: event.code,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      timestamp: Date.now()
    };
    
    // Dispatch events
    this.dispatchEvent('keypress', {
      key: event.key,
      down: false,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    });
    this.dispatchEvent('interaction', interaction);
  }
  
  /**
   * Prevent context menu on right click
   * @param {MouseEvent} event - Mouse event
   */
  onContextMenu(event) {
    if (this.isActive) {
      event.preventDefault();
    }
  }
  
  /**
   * Handle drag gesture
   * @param {number} deltaX - X movement
   * @param {number} deltaY - Y movement
   * @param {Event} event - Original event
   */
  handleDrag(deltaX, deltaY, event) {
    if (!this.fractalEngine) return;
    
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;
    
    // Create drag interaction event
    const dragEvent = {
      deltaX,
      deltaY,
      x: event.clientX,
      y: event.clientY,
      button: this.mouse.button,
      modifiers: {
        shift: event.shiftKey,
        ctrl: event.ctrlKey,
        alt: event.altKey
      }
    };
    
    // Update fractal center based on drag direction
    const zoom = this.fractalEngine.parameters.zoom;
    const dragSpeed = this.panSpeed / zoom; // Adjust speed based on zoom level
    
    const centerX = this.fractalEngine.parameters.centerX;
    const centerY = this.fractalEngine.parameters.centerY;
    
    // Check if we need to apply rotation
    if (this.fractalEngine.parameters.rotationAngle !== 0) {
      const angle = this.fractalEngine.parameters.rotationAngle;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Rotate the delta
      const rotatedDeltaX = deltaX * cos + deltaY * sin;
      const rotatedDeltaY = -deltaX * sin + deltaY * cos;
      
      this.fractalEngine.setParameter('centerX', centerX - rotatedDeltaX * dragSpeed);
      this.fractalEngine.setParameter('centerY', centerY + rotatedDeltaY * dragSpeed);
    } else {
      // No rotation, just apply the delta directly
      this.fractalEngine.setParameter('centerX', centerX - deltaX * dragSpeed);
      this.fractalEngine.setParameter('centerY', centerY + deltaY * dragSpeed);
    }
    
    // Dispatch drag move event
    this.dispatchEvent('dragMove', dragEvent);
  }
  
  /**
   * Handle pan gesture
   * @param {number} deltaX - X movement
   * @param {number} deltaY - Y movement
   * @param {Event} event - Original event
   */
  handlePan(deltaX, deltaY, event) {
    // Pan is similar to drag but can behave differently if needed
    this.handleDrag(deltaX, deltaY, event);
    
    // Dispatch pan event
    this.dispatchEvent('pan', {
      deltaX,
      deltaY,
      x: event ? event.clientX : 0,
      y: event ? event.clientY : 0
    });
  }
  
  /**
   * Handle rotate gesture
   * @param {number} deltaX - X movement
   * @param {number} deltaY - Y movement
   * @param {Event} event - Original event
   */
  handleRotate(deltaX, deltaY, event) {
    if (!this.fractalEngine) return;
    
    // Calculate rotation based on x movement (could be changed to use both x and y for more advanced rotation)
    const rotationDelta = deltaX * this.rotateSpeed;
    
    // Apply rotation
    const currentAngle = this.fractalEngine.parameters.rotationAngle;
    this.fractalEngine.setParameter('rotationAngle', currentAngle + rotationDelta);
    
    // Dispatch rotate event
    this.dispatchEvent('rotate', {
      delta: rotationDelta,
      totalAngle: this.fractalEngine.parameters.rotationAngle,
      x: event ? event.clientX : 0,
      y: event ? event.clientY : 0
    });
  }
  
  /**
   * Handle zoom gesture
   * @param {number} factor - Zoom factor (>1 for zoom in, <1 for zoom out)
   * @param {number} x - X coordinate of zoom center
   * @param {number} y - Y coordinate of zoom center
   */
  handleZoom(factor, x, y) {
    if (!this.fractalEngine) return;
    
    // Calculate new zoom
    const currentZoom = this.fractalEngine.parameters.zoom;
    const newZoom = currentZoom * factor;
    
    // Apply zoom
    this.fractalEngine.setParameter('zoom', newZoom);
    
    // If we have coordinates, adjust center to zoom toward that point
    if (x !== undefined && y !== undefined) {
      // Convert screen coordinates to fractal coordinates
      const fractalCoords = this.fractalEngine.renderers[this.fractalEngine.activeRenderer]
        .screenToFractalCoordinates(x, y);
      
      // Get current center
      const currentCenterX = this.fractalEngine.parameters.centerX;
      const currentCenterY = this.fractalEngine.parameters.centerY;
      
      // Move center slightly toward zoom point
      const adjustmentFactor = 1 - (1 / factor); // Stronger adjustment for larger zoom changes
      const newCenterX = currentCenterX + (fractalCoords.x - currentCenterX) * adjustmentFactor;
      const newCenterY = currentCenterY + (fractalCoords.y - currentCenterY) * adjustmentFactor;
      
      this.fractalEngine.setParameter('centerX', newCenterX);
      this.fractalEngine.setParameter('centerY', newCenterY);
    }
    
    // Dispatch zoom event
    this.dispatchEvent('zoom', {
      factor,
      newZoom,
      x,
      y
    });
  }
  
  /**
   * Handle click on the fractal
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  handleFractalClick(x, y) {
    if (!this.fractalEngine) return;
    
    // Convert screen coordinates to fractal coordinates
    const fractalCoords = this.fractalEngine.renderers[this.fractalEngine.activeRenderer]
      .screenToFractalCoordinates(x, y);
    
    // Create click interaction event with fractal coordinates
    const interaction = {
      type: 'fractalClick',
      screen: { x, y },
      fractal: fractalCoords,
      timestamp: Date.now()
    };
    
    // Dispatch interaction event
    this.dispatchEvent('interaction', interaction);
    
    // If in Julia set mode, use the clicked point as new Julia parameters
    if (this.fractalEngine.activeRenderer === 'julia') {
      // Don't change parameters on every click - this would be annoying
      // Instead, only change if a modifier key is pressed
      if (this.keys.has('shift') || this.keys.has('control') || this.keys.has('alt')) {
        this.fractalEngine.setParameter('juliaReal', fractalCoords.x);
        this.fractalEngine.setParameter('juliaImag', fractalCoords.y);
      }
    }
    // If in Mandelbrot mode, could jump to Julia set using clicked point
    else if (this.fractalEngine.activeRenderer === 'mandelbrot' && 
             this.keys.has('j')) {
      // Switch to Julia set with parameters from clicked point
      this.fractalEngine.setParameter('juliaReal', fractalCoords.x);
      this.fractalEngine.setParameter('juliaImag', fractalCoords.y);
      this.fractalEngine.setFractalType('julia');
    }
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
   * Get the current state of the input handler
   * @returns {Object} - Current state
   */
  getState() {
    return {
      isActive: this.isActive,
      isDragging: this.isDragging,
      isZooming: this.isZooming,
      isPanning: this.isPanning,
      isRotating: this.isRotating,
      mouse: { ...this.mouse },
      touches: this.touches.length,
      pressedKeys: Array.from(this.keys)
    };
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove DOM event listeners
    const canvas = this.fractalEngine ? 
      this.fractalEngine.threeRenderer?.domElement : 
      document.querySelector('canvas');
    
    if (canvas) {
      canvas.removeEventListener('mousedown', this.onMouseDown);
      canvas.removeEventListener('wheel', this.onMouseWheel);
      canvas.removeEventListener('touchstart', this.onTouchStart);
      canvas.removeEventListener('contextmenu', this.onContextMenu);
    }
    
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    
    // Clear event handlers
    Object.keys(this.eventHandlers).forEach(event => {
      this.eventHandlers[event] = [];
    });
    
    // Clear interaction map
    this.interactionMap.clear();
    
    // Reset state
    this.resetState();
    this.isActive = false;
    
    console.log('InputHandler disposed');
  }
}

export default InputHandler;