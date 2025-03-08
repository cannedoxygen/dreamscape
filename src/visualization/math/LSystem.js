/**
 * LSystem.js
 * 
 * Implements Lindenmayer Systems (L-systems) for generating fractal structures.
 * L-systems use string rewriting rules to create complex patterns from simple axioms.
 */

export class LSystem {
    /**
     * Initialize an L-system
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.config = options.config || {};
      
      // Core L-system properties
      this.axiom = this.config.axiom || 'F';
      this.rules = this.config.rules || { 'F': 'F+F-F-F+F' };
      this.iterations = this.config.iterations || 3;
      this.angle = this.config.angle || 90;
      this.stepLength = this.config.stepLength || 10;
      this.scaleFactor = this.config.scaleFactor || 0.5;
      
      // Rendering properties
      this.lineWidth = this.config.lineWidth || 1;
      this.color = this.config.color || '#ffffff';
      this.backgroundColor = this.config.backgroundColor || 'transparent';
      
      // Stochastic properties
      this.stochastic = this.config.stochastic || false;
      this.stochasticRules = this.config.stochasticRules || {};
      
      // Cached results
      this.currentString = null;
      this.commands = null;
      this.boundingBox = null;
    }
    
    /**
     * Generate the L-system string based on the current configuration
     * @returns {string} - Generated L-system string
     */
    generate() {
      // Start with the axiom
      let result = this.axiom;
      
      // Apply rules for the specified number of iterations
      for (let i = 0; i < this.iterations; i++) {
        let nextResult = '';
        
        // Process each character in the current result
        for (let j = 0; j < result.length; j++) {
          const char = result[j];
          
          // Check if there's a rule for this character
          if (this.rules[char]) {
            if (this.stochastic && this.stochasticRules[char]) {
              // Apply stochastic rule
              const rules = this.stochasticRules[char];
              const random = Math.random();
              let cumulativeProbability = 0;
              
              for (const rule of rules) {
                cumulativeProbability += rule.probability;
                if (random <= cumulativeProbability) {
                  nextResult += rule.successor;
                  break;
                }
              }
            } else {
              // Apply deterministic rule
              nextResult += this.rules[char];
            }
          } else {
            // No rule, keep the character as is
            nextResult += char;
          }
        }
        
        result = nextResult;
      }
      
      this.currentString = result;
      return result;
    }
    
    /**
     * Calculate the turtle graphics commands for drawing the L-system
     * @returns {Array} - Commands for drawing
     */
    calculateCommands() {
      if (!this.currentString) {
        this.generate();
      }
      
      const commands = [];
      const stack = [];
      let position = { x: 0, y: 0 };
      let direction = -90; // Start pointing up
      let currentStep = this.stepLength;
      
      // Calculate boundaries for scaling/centering
      let minX = 0, minY = 0, maxX = 0, maxY = 0;
      
      // Process each character in the L-system string
      for (let i = 0; i < this.currentString.length; i++) {
        const char = this.currentString[i];
        
        switch (char) {
          case 'F': // Move forward and draw a line
          case 'G': // Same as F
            // Calculate new position
            const radians = direction * Math.PI / 180;
            const newX = position.x + currentStep * Math.cos(radians);
            const newY = position.y + currentStep * Math.sin(radians);
            
            // Add draw command
            commands.push({
              type: 'line',
              from: { ...position },
              to: { x: newX, y: newY }
            });
            
            // Update position
            position.x = newX;
            position.y = newY;
            
            // Update boundaries
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x);
            maxY = Math.max(maxY, position.y);
            break;
            
          case 'f': // Move forward without drawing
            // Calculate new position
            const moveRadians = direction * Math.PI / 180;
            position.x += currentStep * Math.cos(moveRadians);
            position.y += currentStep * Math.sin(moveRadians);
            
            // Update boundaries
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x);
            maxY = Math.max(maxY, position.y);
            break;
            
          case '+': // Turn left
            direction += this.angle;
            break;
            
          case '-': // Turn right
            direction -= this.angle;
            break;
            
          case '[': // Push state to stack
            stack.push({
              position: { ...position },
              direction,
              step: currentStep
            });
            break;
            
          case ']': // Pop state from stack
            if (stack.length > 0) {
              const state = stack.pop();
              position = state.position;
              direction = state.direction;
              currentStep = state.step;
            }
            break;
            
          case '!': // Decrease line width
            commands.push({
              type: 'lineWidth',
              value: Math.max(0.5, this.lineWidth * 0.8)
            });
            break;
            
          case '@': // Change color slightly
            commands.push({
              type: 'color',
              value: this.getRandomColorVariation(this.color)
            });
            break;
            
          case '&': // Reduce step size
            currentStep *= this.scaleFactor;
            break;
            
          case '^': // Increase step size
            currentStep /= this.scaleFactor;
            break;
            
          case '|': // Turn around (180 degrees)
            direction += 180;
            break;
        }
      }
      
      this.commands = commands;
      this.boundingBox = {
        minX, minY, maxX, maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
      
      return commands;
    }
    
    /**
     * Draw the L-system on a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} options - Drawing options
     */
    draw(ctx, options = {}) {
      const {
        x = 0,
        y = 0,
        scale = 1,
        centerX = 0.5,
        centerY = 0.5,
        lineWidth = this.lineWidth,
        color = this.color,
        backgroundColor = this.backgroundColor
      } = options;
      
      if (!this.commands) {
        this.calculateCommands();
      }
      
      const bb = this.boundingBox;
      
      // Calculate translation to position the L-system
      const translateX = x - (bb.minX + (bb.width * centerX)) * scale;
      const translateY = y - (bb.minY + (bb.height * centerY)) * scale;
      
      // Save context state
      ctx.save();
      
      // Draw background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      
      // Apply transformations
      ctx.translate(translateX, translateY);
      ctx.scale(scale, scale);
      
      // Set initial drawing style
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      let currentLineWidth = lineWidth;
      let currentColor = color;
      
      // Draw the L-system
      for (const cmd of this.commands) {
        switch (cmd.type) {
          case 'line':
            ctx.beginPath();
            ctx.moveTo(cmd.from.x, cmd.from.y);
            ctx.lineTo(cmd.to.x, cmd.to.y);
            ctx.stroke();
            break;
            
          case 'lineWidth':
            currentLineWidth = cmd.value;
            ctx.lineWidth = currentLineWidth;
            break;
            
          case 'color':
            currentColor = cmd.value;
            ctx.strokeStyle = currentColor;
            break;
        }
      }
      
      // Restore context state
      ctx.restore();
    }
    
    /**
     * Get SVG representation of the L-system
     * @param {Object} options - SVG options
     * @returns {string} - SVG string
     */
    toSVG(options = {}) {
      const {
        width = 800,
        height = 600,
        margin = 20,
        lineWidth = this.lineWidth,
        color = this.color,
        backgroundColor = this.backgroundColor
      } = options;
      
      if (!this.commands) {
        this.calculateCommands();
      }
      
      const bb = this.boundingBox;
      
      // Calculate scale to fit within the specified dimensions with margin
      const scaleX = (width - margin * 2) / bb.width;
      const scaleY = (height - margin * 2) / bb.height;
      const scale = Math.min(scaleX, scaleY);
      
      // Calculate translation to center the L-system
      const translateX = margin - bb.minX * scale + (width - bb.width * scale) / 2;
      const translateY = margin - bb.minY * scale + (height - bb.height * scale) / 2;
      
      // Start building SVG
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
      
      // Add background if not transparent
      if (backgroundColor !== 'transparent') {
        svg += `  <rect width="${width}" height="${height}" fill="${backgroundColor}" />\n`;
      }
      
      // Group for the L-system with transform
      svg += `  <g transform="translate(${translateX} ${translateY}) scale(${scale})">\n`;
      
      // Add each line
      for (const cmd of this.commands) {
        if (cmd.type === 'line') {
          svg += `    <line x1="${cmd.from.x}" y1="${cmd.from.y}" x2="${cmd.to.x}" y2="${cmd.to.y}" 
            stroke="${color}" stroke-width="${lineWidth / scale}" stroke-linecap="round" />\n`;
        }
      }
      
      // Close group and SVG
      svg += '  </g>\n</svg>';
      
      return svg;
    }
    
    /**
     * Create a random variation of a color
     * @param {string} color - Base color
     * @returns {string} - Varied color
     * @private
     */
    getRandomColorVariation(color) {
      // Parse color from hex or CSS color name
      let r, g, b;
      
      if (color.startsWith('#')) {
        // Parse hex color
        const hex = color.substring(1);
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        }
      } else {
        // Create a dummy element to parse CSS color
        const dummy = document.createElement('div');
        dummy.style.color = color;
        document.body.appendChild(dummy);
        const computedColor = window.getComputedStyle(dummy).color;
        document.body.removeChild(dummy);
        
        // Parse RGB values
        const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          r = parseInt(rgbMatch[1]);
          g = parseInt(rgbMatch[2]);
          b = parseInt(rgbMatch[3]);
        } else {
          // Default to original color if parsing fails
          return color;
        }
      }
      
      // Add small random variation to each component
      const variation = 20;
      r = Math.max(0, Math.min(255, r + Math.floor(Math.random() * variation * 2 - variation)));
      g = Math.max(0, Math.min(255, g + Math.floor(Math.random() * variation * 2 - variation)));
      b = Math.max(0, Math.min(255, b + Math.floor(Math.random() * variation * 2 - variation)));
      
      // Convert back to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * Set L-system parameters
     * @param {Object} params - Parameters to set
     */
    setParameters(params = {}) {
      // Update L-system properties
      if (params.axiom !== undefined) this.axiom = params.axiom;
      if (params.rules !== undefined) this.rules = params.rules;
      if (params.iterations !== undefined) this.iterations = params.iterations;
      if (params.angle !== undefined) this.angle = params.angle;
      if (params.stepLength !== undefined) this.stepLength = params.stepLength;
      if (params.scaleFactor !== undefined) this.scaleFactor = params.scaleFactor;
      
      // Update rendering properties
      if (params.lineWidth !== undefined) this.lineWidth = params.lineWidth;
      if (params.color !== undefined) this.color = params.color;
      if (params.backgroundColor !== undefined) this.backgroundColor = params.backgroundColor;
      
      // Update stochastic properties
      if (params.stochastic !== undefined) this.stochastic = params.stochastic;
      if (params.stochasticRules !== undefined) this.stochasticRules = params.stochasticRules;
      
      // Reset cached results
      this.currentString = null;
      this.commands = null;
      this.boundingBox = null;
    }
    
    /**
     * Get preset L-system configurations
     * @param {string} name - Preset name
     * @returns {Object} - L-system configuration
     */
    static getPreset(name) {
      const presets = {
        'koch': {
          axiom: 'F',
          rules: { 'F': 'F+F-F-F+F' },
          iterations: 4,
          angle: 90
        },
        'dragon': {
          axiom: 'FX',
          rules: { 'X': 'X+YF+', 'Y': '-FX-Y' },
          iterations: 10,
          angle: 90
        },
        'sierpinski': {
          axiom: 'F-G-G',
          rules: { 'F': 'F-G+F+G-F', 'G': 'GG' },
          iterations: 5,
          angle: 120
        },
        'plant': {
          axiom: 'X',
          rules: { 'X': 'F-[[X]+X]+F[+FX]-X', 'F': 'FF' },
          iterations: 5,
          angle: 25,
          color: '#00AA00'
        },
        'stochastic-plant': {
          axiom: 'X',
          rules: { 'F': 'FF' },
          stochastic: true,
          stochasticRules: {
            'X': [
              { probability: 0.33, successor: 'F-[[X]+X]+F[+FX]-X' },
              { probability: 0.33, successor: 'F+[[X]-X]-F[-FX]+X' },
              { probability: 0.34, successor: 'F[+X][-X]FX' }
            ]
          },
          iterations: 5,
          angle: 25,
          color: '#00AA00'
        },
        'hilbert': {
          axiom: 'X',
          rules: { 'X': '-YF+XFX+FY-', 'Y': '+XF-YFY-FX+' },
          iterations: 5,
          angle: 90
        },
        'fractal-tree': {
          axiom: 'F',
          rules: { 'F': 'FF+[+F-F-F]-[-F+F+F]' },
          iterations: 4,
          angle: 25,
          color: '#885500'
        }
      };
      
      return presets[name] || presets['koch'];
    }
  }
  
  export default LSystem;