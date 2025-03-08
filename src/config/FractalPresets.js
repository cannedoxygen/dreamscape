/**
 * FractalPresets.js
 * 
 * A collection of predefined fractal settings and configurations.
 * Provides quick access to interesting fractal views and parameters.
 */

export class FractalPresets {
    /**
     * Get all available preset categories
     * @returns {Object} - Categories with preset names
     */
    static getCategories() {
      return {
        mandelbrot: [
          'classicMandelbrot',
          'seahorseValley',
          'elephantValley',
          'miniMandelbrot',
          'spiralRegion',
          'dendriteFormation'
        ],
        julia: [
          'classicJulia',
          'dendriteFractal',
          'spiralJulia',
          'doubleSpiral',
          'quadraticJulia',
          'starburstJulia'
        ],
        other2D: [
          'burningShip',
          'tricorn',
          'newton',
          'sierpinskiGasket',
          'kochSnowflake',
          'apollonian'
        ],
        hyperbolic: [
          'triangularTiling',
          'squareTiling',
          'pentagonalTiling',
          'mixedTiling'
        ],
        mandelbulb: [
          'classicMandelbulb',
          'power3Mandelbulb',
          'cosineVariant',
          'hybridFormation'
        ],
        audioReactive: [
          'pulsatingMandelbrot',
          'bassReactiveJulia',
          'rhythmicZoom',
          'spectrumMapping'
        ]
      };
    }
    
    /**
     * Get all available preset names
     * @returns {Array} - List of all preset names
     */
    static getAllPresetNames() {
      const categories = this.getCategories();
      const presets = [];
      
      Object.values(categories).forEach(categoryPresets => {
        presets.push(...categoryPresets);
      });
      
      return presets;
    }
    
    /**
     * Get a preset by name
     * @param {string} name - Preset name
     * @returns {Object} - Preset configuration
     */
    static getPreset(name) {
      const presets = this.presets();
      return presets[name] || presets.classicMandelbrot;
    }
    
    /**
     * Get a random preset
     * @param {string} category - Optional category filter
     * @returns {Object} - Random preset
     */
    static getRandomPreset(category = null) {
      let presetNames;
      
      if (category && this.getCategories()[category]) {
        presetNames = this.getCategories()[category];
      } else {
        presetNames = this.getAllPresetNames();
      }
      
      const randomIndex = Math.floor(Math.random() * presetNames.length);
      const randomName = presetNames[randomIndex];
      
      return this.getPreset(randomName);
    }
    
    /**
     * All available presets
     * @returns {Object} - All presets by name
     */
    static presets() {
      return {
        // Mandelbrot Set Presets
        classicMandelbrot: {
          name: 'Classic Mandelbrot',
          description: 'The classic view of the Mandelbrot set',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.5,
            centerY: 0,
            zoom: 0.7,
            iterations: 100,
            colorShift: 0.0,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.5
            },
            feedback: {
              enabled: false
            },
            colorCycler: {
              speed: 0.1,
              enabled: true
            }
          }
        },
        
        seahorseValley: {
          name: 'Seahorse Valley',
          description: 'The famous seahorse valley region of the Mandelbrot set',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.75,
            centerY: 0.1,
            zoom: 10,
            iterations: 500,
            colorShift: 0.5,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.6
            }
          }
        },
        
        elephantValley: {
          name: 'Elephant Valley',
          description: 'A region with structures resembling elephants',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.125,
            centerY: 0.649,
            zoom: 20,
            iterations: 500,
            colorShift: 0.8,
            rotationAngle: 0,
            exponent: 2,
            bailout: 8
          }
        },
        
        miniMandelbrot: {
          name: 'Mini Mandelbrot',
          description: 'One of the mini Mandelbrot sets within the main set',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -1.77,
            centerY: 0,
            zoom: 40,
            iterations: 1000,
            colorShift: 0.2,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          }
        },
        
        spiralRegion: {
          name: 'Spiral Region',
          description: 'A spiral formation within the Mandelbrot set',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.761574,
            centerY: -0.0847596,
            zoom: 200,
            iterations: 1000,
            colorShift: 0.7,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          }
        },
        
        dendriteFormation: {
          name: 'Dendrite Formation',
          description: 'A branch-like formation on the edge of the set',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.2929859127507,
            centerY: 0.6493926288459,
            zoom: 150,
            iterations: 800,
            colorShift: 0.3,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          }
        },
        
        // Julia Set Presets
        classicJulia: {
          name: 'Classic Julia',
          description: 'A classic Julia set',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.8,
            iterations: 100,
            colorShift: 0.0,
            rotationAngle: 0,
            juliaReal: -0.7,
            juliaImag: 0.27,
            exponent: 2,
            bailout: 4
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.5
            },
            feedback: {
              enabled: false
            }
          }
        },
        
        dendriteFractal: {
          name: 'Dendrite Julia',
          description: 'A Julia set with branching dendrite structures',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.5,
            iterations: 120,
            colorShift: 0.2,
            rotationAngle: 0,
            juliaReal: -0.1,
            juliaImag: 0.8,
            exponent: 2,
            bailout: 4
          }
        },
        
        spiralJulia: {
          name: 'Spiral Julia',
          description: 'A Julia set with prominent spiral patterns',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.8,
            iterations: 150,
            colorShift: 0.5,
            rotationAngle: 0,
            juliaReal: -0.54,
            juliaImag: 0.54,
            exponent: 2,
            bailout: 4
          }
        },
        
        doubleSpiral: {
          name: 'Double Spiral',
          description: 'A Julia set with two interlocking spirals',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.8,
            iterations: 200,
            colorShift: 0.7,
            rotationAngle: 0,
            juliaReal: 0.0,
            juliaImag: 0.8,
            exponent: 2,
            bailout: 4
          }
        },
        
        quadraticJulia: {
          name: 'Quadratic Julia',
          description: 'A Julia set with four-fold symmetry',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.2,
            iterations: 100,
            colorShift: 0.9,
            rotationAngle: 0,
            juliaReal: -0.4,
            juliaImag: 0.6,
            exponent: 2,
            bailout: 4
          }
        },
        
        starburstJulia: {
          name: 'Starburst Julia',
          description: 'A Julia set with a starburst pattern',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.0,
            iterations: 150,
            colorShift: 0.3,
            rotationAngle: 0,
            juliaReal: 0.355,
            juliaImag: 0.355,
            exponent: 2,
            bailout: 4
          }
        },
        
        // Other 2D Fractals
        burningShip: {
          name: 'Burning Ship',
          description: 'The Burning Ship fractal',
          fractalType: 'burningShip',
          parameters: {
            centerX: -0.5,
            centerY: -0.5,
            zoom: 0.7,
            iterations: 100,
            colorShift: 0.6,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          }
        },
        
        tricorn: {
          name: 'Tricorn',
          description: 'The Tricorn (Mandelbar) fractal',
          fractalType: 'tricorn',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.8,
            iterations: 100,
            colorShift: 0.4,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          }
        },
        
        newton: {
          name: 'Newton Fractal',
          description: 'Newton fractal for z^3 - 1',
          fractalType: 'newton',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.8,
            iterations: 40,
            colorShift: 0.1,
            rotationAngle: 0
          }
        },
        
        sierpinskiGasket: {
          name: 'Sierpinski Gasket',
          description: 'The classic Sierpinski triangle fractal',
          fractalType: 'sierpinski',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.5,
            iterations: 8,
            colorShift: 0.0,
            rotationAngle: 0
          }
        },
        
        kochSnowflake: {
          name: 'Koch Snowflake',
          description: 'The Koch snowflake fractal',
          fractalType: 'koch',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.5,
            iterations: 5,
            colorShift: 0.0,
            rotationAngle: 0
          }
        },
        
        apollonian: {
          name: 'Apollonian Gasket',
          description: 'An Apollonian gasket circle packing fractal',
          fractalType: 'apollonian',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.0,
            iterations: 5,
            colorShift: 0.2,
            rotationAngle: 0
          }
        },
        
        // Hyperbolic Tilings
        triangularTiling: {
          name: 'Triangular Tiling',
          description: 'Hyperbolic tiling with triangles',
          fractalType: 'hyperbolic',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.0,
            iterations: 100,
            colorShift: 0.0,
            rotationAngle: 0,
            p: 3, // Triangle
            q: 7  // 7 triangles at each vertex
          }
        },
        
        squareTiling: {
          name: 'Square Tiling',
          description: 'Hyperbolic tiling with squares',
          fractalType: 'hyperbolic',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 1.0,
            iterations: 100,
            colorShift: 0.5,
            rotationAngle: 0,
            p: 4, // Square
            q: 5  // 5 squares at each vertex
          }
        },
        
        pentagonalTiling: {
          name: 'Pentagonal Tiling',
          description: 'Hyperbolic tiling with pentagons',
          fractalType: 'hyperbolic',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.9,
            iterations: 100,
            colorShift: 0.8,
            rotationAngle: 0,
            p: 5, // Pentagon
            q: 4  // 4 pentagons at each vertex
          }
        },
        
        mixedTiling: {
          name: 'Mixed Tiling',
          description: 'Hyperbolic tiling with heptagons (7-sided)',
          fractalType: 'hyperbolic',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.9,
            iterations: 100,
            colorShift: 0.3,
            rotationAngle: 0,
            p: 7, // Heptagon
            q: 3  // 3 heptagons at each vertex
          }
        },
        
        // 3D Fractals (Mandelbulb)
        classicMandelbulb: {
          name: 'Classic Mandelbulb',
          description: 'The classic 3D Mandelbulb fractal',
          fractalType: 'mandelbulb',
          parameters: {
            power: 8.0,
            maxIterations: 10,
            bailout: 2.0,
            colorShift: 0.0,
            detail: 1.0,
            colorMode: 1
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.7
            }
          }
        },
        
        power3Mandelbulb: {
          name: 'Power 3 Mandelbulb',
          description: 'Mandelbulb with power parameter set to 3',
          fractalType: 'mandelbulb',
          parameters: {
            power: 3.0,
            maxIterations: 8,
            bailout: 2.0,
            colorShift: 0.5,
            detail: 0.8,
            colorMode: 1
          }
        },
        
        cosineVariant: {
          name: 'Cosine Mandelbulb',
          description: 'Mandelbulb variant with cosine formulas',
          fractalType: 'mandelbulb',
          parameters: {
            power: 5.0,
            maxIterations: 10,
            bailout: 4.0,
            colorShift: 0.7,
            detail: 1.0,
            colorMode: 0
          }
        },
        
        hybridFormation: {
          name: 'Hybrid Mandelbulb',
          description: 'A hybrid Mandelbulb with interesting formations',
          fractalType: 'mandelbulb',
          parameters: {
            power: 6.0,
            maxIterations: 12,
            bailout: 3.0,
            colorShift: 0.2,
            detail: 1.2,
            colorMode: 2
          }
        },
        
        // Audio-reactive Presets
        pulsatingMandelbrot: {
          name: 'Pulsating Mandelbrot',
          description: 'A Mandelbrot preset that pulses with the audio',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.6,
            centerY: 0,
            zoom: 0.8,
            iterations: 150,
            colorShift: 0.0,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.6
            },
            feedback: {
              enabled: true,
              amount: 0.3,
              fadeSpeed: 0.1,
              zoom: 1.01,
              rotation: 0.002
            },
            colorCycler: {
              speed: 0.2,
              audioReactive: true
            }
          },
          audioReactive: true
        },
        
        bassReactiveJulia: {
          name: 'Bass-reactive Julia',
          description: 'A Julia set that reacts to bass frequencies',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.9,
            iterations: 120,
            colorShift: 0.5,
            rotationAngle: 0,
            juliaReal: -0.8,
            juliaImag: 0.156,
            exponent: 2,
            bailout: 4
          },
          effects: {
            feedback: {
              enabled: true,
              amount: 0.2,
              fadeSpeed: 0.05,
              zoom: 1.005,
              rotation: 0.001
            }
          },
          audioReactive: true
        },
        
        rhythmicZoom: {
          name: 'Rhythmic Zoom',
          description: 'A preset that zooms in/out with the beat',
          fractalType: 'mandelbrot',
          parameters: {
            centerX: -0.745,
            centerY: 0.186,
            zoom: 2.5,
            iterations: 300,
            colorShift: 0.3,
            rotationAngle: 0,
            exponent: 2,
            bailout: 4
          },
          effects: {
            bloom: {
              enabled: true,
              strength: 0.5
            },
            feedback: {
              enabled: true,
              amount: 0.15,
              fadeSpeed: 0.2,
              zoom: 1.02
            }
          },
          audioReactive: true
        },
        
        spectrumMapping: {
          name: 'Spectrum Mapping',
          description: 'Maps audio frequency spectrum to fractal coloring',
          fractalType: 'julia',
          parameters: {
            centerX: 0,
            centerY: 0,
            zoom: 0.75,
            iterations: 100,
            colorShift: 0.0,
            rotationAngle: 0,
            juliaReal: -0.4,
            juliaImag: 0.6,
            exponent: 2,
            bailout: 4
          },
          effects: {
            colorCycler: {
              speed: 0.1,
              audioReactive: true
            }
          },
          audioReactive: true
        }
      };
    }
    
    /**
     * Generate a smooth transition between two presets
     * @param {string|Object} from - Starting preset name or object
     * @param {string|Object} to - Target preset name or object
     * @param {number} progress - Transition progress (0-1)
     * @returns {Object} - Interpolated preset
     */
    static interpolatePresets(from, to, progress) {
      // Get preset objects if names were provided
      const fromPreset = typeof from === 'string' ? this.getPreset(from) : from;
      const toPreset = typeof to === 'string' ? this.getPreset(to) : to;
      
      // Create a new preset object
      const result = {
        name: `Transition (${Math.round(progress * 100)}%)`,
        description: `Transition from ${fromPreset.name} to ${toPreset.name}`,
        fractalType: progress < 0.5 ? fromPreset.fractalType : toPreset.fractalType,
        parameters: {},
        effects: {}
      };
      
      // Interpolate parameters
      const fromParams = fromPreset.parameters || {};
      const toParams = toPreset.parameters || {};
      
      // Merge all possible parameter keys
      const allParamKeys = new Set([
        ...Object.keys(fromParams),
        ...Object.keys(toParams)
      ]);
      
      // Interpolate each parameter
      allParamKeys.forEach(key => {
        // Skip keys that don't exist in both presets and would cause visual jumps
        if (key === 'juliaReal' || key === 'juliaImag' || key === 'exponent') {
          if (fromPreset.fractalType !== toPreset.fractalType) {
            result.parameters[key] = progress < 0.5 ? fromParams[key] : toParams[key];
            return;
          }
        }
        
        // Handle rotation angle specially to avoid jarring transitions
        if (key === 'rotationAngle') {
          const fromAngle = fromParams[key] || 0;
          const toAngle = toParams[key] || 0;
          let diff = toAngle - fromAngle;
          
          // Take the shorter path around the circle
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          
          result.parameters[key] = fromAngle + diff * progress;
        } 
        // Linear interpolation for numeric values
        else if (typeof fromParams[key] === 'number' && typeof toParams[key] === 'number') {
          result.parameters[key] = fromParams[key] + (toParams[key] - fromParams[key]) * progress;
        }
        // Copy non-numeric values directly based on progress threshold
        else {
          result.parameters[key] = progress < 0.5 ? 
            (fromParams[key] !== undefined ? fromParams[key] : toParams[key]) : 
            (toParams[key] !== undefined ? toParams[key] : fromParams[key]);
        }
      });
      
      // Interpolate effects with simple strategy
      const fromEffects = fromPreset.effects || {};
      const toEffects = toPreset.effects || {};
      
      // Start with from effects
      result.effects = JSON.parse(JSON.stringify(fromEffects));
      
      // Add or override with to effects based on progress
      if (progress > 0.3) {
        Object.entries(toEffects).forEach(([effectName, effectConfig]) => {
          // If effect exists in both, blend properties
          if (result.effects[effectName]) {
            Object.entries(effectConfig).forEach(([prop, value]) => {
              // Linear interpolation for numeric values
              if (typeof value === 'number' && typeof result.effects[effectName][prop] === 'number') {
                const p = (progress - 0.3) / 0.7; // Rescale progress from 0.3-1 to 0-1
                result.effects[effectName][prop] = result.effects[effectName][prop] + 
                  (value - result.effects[effectName][prop]) * p;
              }
              // Boolean values switch at 50%
              else if (typeof value === 'boolean') {
                if (progress > 0.5) {
                  result.effects[effectName][prop] = value;
                }
              }
              // Other values switch at 50%
              else if (progress > 0.5) {
                result.effects[effectName][prop] = value;
              }
            });
          }
          // If effect only exists in to preset, phase it in gradually
          else if (progress > 0.5) {
            const p = (progress - 0.5) / 0.5; // Rescale progress from 0.5-1 to 0-1
            result.effects[effectName] = { ...effectConfig };
            
            // Reduce effect strength during transition
            if (effectName === 'bloom' && typeof result.effects[effectName].strength === 'number') {
              result.effects[effectName].strength *= p;
            }
            else if (effectName === 'feedback' && typeof result.effects[effectName].amount === 'number') {
              result.effects[effectName].amount *= p;
            }
          }
        });
      }
      
      // Handle audioReactive flag
      if (fromPreset.audioReactive && toPreset.audioReactive) {
        result.audioReactive = true;
      } else if (fromPreset.audioReactive || toPreset.audioReactive) {
        result.audioReactive = progress > 0.5 ? toPreset.audioReactive : fromPreset.audioReactive;
      }
      
      return result;
    }
  }
  
  export default FractalPresets;