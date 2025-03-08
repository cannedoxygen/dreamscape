/**
 * AudioPresets.js
 * 
 * A collection of predefined audio settings for different moods and effects.
 * Provides quick access to interesting audio configurations.
 */

export class AudioPresets {
    /**
     * Get all available preset categories
     * @returns {Object} - Categories with preset names
     */
    static getCategories() {
      return {
        ambient: [
          'spaceDrone',
          'cosmicChorus',
          'deepAmbient',
          'floatingPad',
          'shimmeringHaze'
        ],
        rhythmic: [
          'pulseBeat',
          'heartbeat',
          'slowPulse',
          'technoRhythm',
          'organicBeats'
        ],
        binaural: [
          'alphaWaves',
          'thetaWaves',
          'schumannResonance',
          'deepMeditation',
          'focusState'
        ],
        melodic: [
          'arpeggiator',
          'chimes',
          'harmonicSeries',
          'bellTones',
          'morningDew'
        ],
        experimental: [
          'noiseScape',
          'randomHarmonics',
          'glitchTones',
          'microTones',
          'chaosTheory'
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
      return presets[name] || presets.spaceDrone;
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
     * Get preset compatible with a fractal preset
     * @param {Object} fractalPreset - Fractal preset object
     * @returns {Object} - Compatible audio preset
     */
    static getCompatiblePreset(fractalPreset) {
      // Match audio preset to fractal type or characteristics
      if (fractalPreset.audioReactive) {
        // For audio-reactive fractals, use rhythmic presets
        return this.getRandomPreset('rhythmic');
      }
      
      if (fractalPreset.fractalType === 'mandelbulb' || fractalPreset.fractalType === 'hyperbolic') {
        // 3D fractals and hyperbolic tilings go well with ambient sounds
        return this.getRandomPreset('ambient');
      }
      
      if (fractalPreset.fractalType === 'julia') {
        // Julia sets pair well with melodic presets
        return this.getRandomPreset('melodic');
      }
      
      if (fractalPreset.fractalType === 'mandelbrot') {
        // Mandelbrot explorations pair well with binaural presets
        return this.getRandomPreset('binaural');
      }
      
      // Default to a random preset
      return this.getRandomPreset();
    }
    
    /**
     * All available presets
     * @returns {Object} - All presets by name
     */
    static presets() {
      return {
        // Ambient Presets
        spaceDrone: {
          name: 'Space Drone',
          description: 'Deep ambient space drone with subtle variations',
          parameters: {
            baseFrequency: 55, // A1 note
            volume: 0.4,
            binauralBeat: 4.5, // Relaxing theta wave
            harmonicRatios: [1, 2, 3, 4, 5, 7, 9],
            tempo: 0, // No beat
            pulseRate: 0,
            filterCutoff: 800,
            filterResonance: 2,
            reverbDecay: 5,
            delayTime: 1.2,
            delayFeedback: 0.3
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 220, // A3 note
            beatFrequency: 4.5,
            volume: 0.25
          },
          harmonics: {
            waveform: 'sine',
            amplitudes: [0.6, 0.25, 0.15, 0.08, 0.05, 0.03, 0.02],
            detunes: [0, 0, 0, 1, -1, 2, -2]
          },
          effects: {
            reverb: {
              wet: 0.7,
              decay: 5
            },
            delay: {
              wet: 0.3,
              delayTime: 1.2,
              feedback: 0.3
            },
            filter: {
              type: 'lowpass',
              frequency: 800,
              Q: 2
            }
          }
        },
        
        cosmicChorus: {
          name: 'Cosmic Chorus',
          description: 'Shimmering ambient chorus with spatial movement',
          parameters: {
            baseFrequency: 220, // A3 note
            volume: 0.4,
            binauralBeat: 6.8, // Alpha/theta border
            harmonicRatios: [1, 1.5, 2, 2.5, 3, 4, 5],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 2000,
            filterResonance: 1,
            reverbDecay: 8,
            delayTime: 0.8,
            delayFeedback: 0.5
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 220,
            beatFrequency: 6.8,
            volume: 0.2
          },
          harmonics: {
            waveform: 'sine',
            amplitudes: [0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02],
            detunes: [0, 3, -2, 5, -4, 7, -6]
          },
          effects: {
            reverb: {
              wet: 0.8,
              decay: 8
            },
            delay: {
              wet: 0.4,
              delayTime: 0.8,
              feedback: 0.5
            }
          }
        },
        
        deepAmbient: {
          name: 'Deep Ambient',
          description: 'Very deep, slow-evolving ambient texture',
          parameters: {
            baseFrequency: 36.71, // D1 note
            volume: 0.45,
            binauralBeat: 3.2, // Deep delta wave
            harmonicRatios: [1, 2, 3, 5, 8, 13],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 500,
            filterResonance: 3,
            reverbDecay: 10,
            delayTime: 2.4,
            delayFeedback: 0.4
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 73.42, // D2 note
            beatFrequency: 3.2,
            volume: 0.3
          },
          harmonics: {
            waveform: 'sine',
            amplitudes: [0.7, 0.3, 0.15, 0.08, 0.04, 0.02],
            detunes: [0, 0, 1, -1, 2, -2]
          }
        },
        
        floatingPad: {
          name: 'Floating Pad',
          description: 'Light, airy pad sound with gentle movement',
          parameters: {
            baseFrequency: 329.63, // E4 note
            volume: 0.35,
            binauralBeat: 9.5, // Alpha wave
            harmonicRatios: [1, 1.25, 1.5, 2, 2.5, 3],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 3000,
            filterResonance: 1,
            reverbDecay: 6,
            delayTime: 0.5,
            delayFeedback: 0.2
          },
          harmonics: {
            waveform: 'triangle',
            amplitudes: [0.5, 0.4, 0.3, 0.2, 0.1, 0.05],
            detunes: [0, 2, -3, 4, -5, 7]
          }
        },
        
        shimmeringHaze: {
          name: 'Shimmering Haze',
          description: 'High, shimmering textures with subtle movement',
          parameters: {
            baseFrequency: 523.25, // C5 note
            volume: 0.3,
            binauralBeat: 7.83, // Schumann resonance
            harmonicRatios: [1, 1.5, 2, 3, 4],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 6000,
            filterResonance: 0.5,
            reverbDecay: 9,
            delayTime: 1.5,
            delayFeedback: 0.6
          },
          effects: {
            reverb: {
              wet: 0.9,
              decay: 9
            }
          }
        },
        
        // Rhythmic Presets
        pulseBeat: {
          name: 'Pulse Beat',
          description: 'Steady pulsing beat with rich harmonics',
          parameters: {
            baseFrequency: 110, // A2 note
            volume: 0.5,
            binauralBeat: 10.2, // Alpha wave
            harmonicRatios: [1, 2, 3, 5],
            tempo: 80, // 80 BPM
            pulseRate: 1, // Quarter notes
            filterCutoff: 2000,
            filterResonance: 4,
            reverbDecay: 1.5,
            delayTime: 0.375, // Dotted eighth note at 80 BPM
            delayFeedback: 0.4
          },
          effects: {
            filter: {
              type: 'lowpass',
              frequency: 2000,
              Q: 4
            }
          }
        },
        
        heartbeat: {
          name: 'Heartbeat',
          description: 'Organic heartbeat rhythm with warm tones',
          parameters: {
            baseFrequency: 82.41, // E2 note
            volume: 0.5,
            binauralBeat: 5.5, // Theta wave
            harmonicRatios: [1, 2, 3, 4],
            tempo: 60, // 60 BPM
            pulseRate: 0.5, // Half notes
            filterCutoff: 1200,
            filterResonance: 2,
            reverbDecay: 2,
            delayTime: 0.5,
            delayFeedback: 0.2
          }
        },
        
        slowPulse: {
          name: 'Slow Pulse',
          description: 'Very slow, meditative pulse with deep bass',
          parameters: {
            baseFrequency: 55, // A1 note
            volume: 0.55,
            binauralBeat: 3.5, // Delta wave
            harmonicRatios: [1, 2, 2.5, 3, 4],
            tempo: 40, // 40 BPM
            pulseRate: 1, // Quarter notes
            filterCutoff: 800,
            filterResonance: 3,
            reverbDecay: 4,
            delayTime: 0.75,
            delayFeedback: 0.3
          }
        },
        
        technoRhythm: {
          name: 'Techno Rhythm',
          description: 'Fast, electronic rhythm with sharp attacks',
          parameters: {
            baseFrequency: 146.83, // D3 note
            volume: 0.45,
            binauralBeat: 8.4, // Alpha wave
            harmonicRatios: [1, 1.5, 2, 3],
            tempo: 120, // 120 BPM
            pulseRate: 2, // Eighth notes
            filterCutoff: 4000,
            filterResonance: 6,
            reverbDecay: 1,
            delayTime: 0.25,
            delayFeedback: 0.5
          },
          effects: {
            filter: {
              type: 'bandpass',
              frequency: 4000,
              Q: 6
            }
          }
        },
        
        organicBeats: {
          name: 'Organic Beats',
          description: 'Natural-sounding rhythmic patterns',
          parameters: {
            baseFrequency: 98, // G2 note
            volume: 0.5,
            binauralBeat: 6, // Theta wave
            harmonicRatios: [1, 1.5, 2, 3, 5],
            tempo: 90, // 90 BPM
            pulseRate: 1, // Quarter notes
            filterCutoff: 2500,
            filterResonance: 2,
            reverbDecay: 2.5,
            delayTime: 0.333, // Triplet at 90 BPM
            delayFeedback: 0.35
          }
        },
        
        // Binaural Presets
        alphaWaves: {
          name: 'Alpha Waves',
          description: 'Relaxing alpha wave binaural beats (8-12 Hz)',
          parameters: {
            baseFrequency: 200,
            volume: 0.4,
            binauralBeat: 10, // Alpha wave
            harmonicRatios: [1, 2, 3],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 1500,
            filterResonance: 1,
            reverbDecay: 3,
            delayTime: 0,
            delayFeedback: 0
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 200,
            beatFrequency: 10,
            volume: 0.5
          }
        },
        
        thetaWaves: {
          name: 'Theta Waves',
          description: 'Deep meditation theta wave binaural beats (4-7 Hz)',
          parameters: {
            baseFrequency: 180,
            volume: 0.45,
            binauralBeat: 5.5, // Theta wave
            harmonicRatios: [1, 1.5, 2],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 1200,
            filterResonance: 0.5,
            reverbDecay: 6,
            delayTime: 0,
            delayFeedback: 0
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 180,
            beatFrequency: 5.5,
            volume: 0.5
          }
        },
        
        schumannResonance: {
          name: 'Schumann Resonance',
          description: 'Earth\'s resonant frequency (7.83 Hz)',
          parameters: {
            baseFrequency: 256, // C4 note
            volume: 0.4,
            binauralBeat: 7.83, // Schumann resonance
            harmonicRatios: [1, 2, 3, 4],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 2000,
            filterResonance: 1,
            reverbDecay: 4,
            delayTime: 0,
            delayFeedback: 0
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 256,
            beatFrequency: 7.83,
            volume: 0.5
          }
        },
        
        deepMeditation: {
          name: 'Deep Meditation',
          description: 'Very low frequency delta waves for deep meditation',
          parameters: {
            baseFrequency: 160,
            volume: 0.5,
            binauralBeat: 2.5, // Delta wave
            harmonicRatios: [1, 2, 3],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 1000,
            filterResonance: 0.5,
            reverbDecay: 10,
            delayTime: 0,
            delayFeedback: 0
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 160,
            beatFrequency: 2.5,
            volume: 0.6
          }
        },
        
        focusState: {
          name: 'Focus State',
          description: 'Beta wave binaural beats for concentration (13-30 Hz)',
          parameters: {
            baseFrequency: 220,
            volume: 0.35,
            binauralBeat: 15, // Beta wave
            harmonicRatios: [1, 2, 3],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 2500,
            filterResonance: 1,
            reverbDecay: 2,
            delayTime: 0,
            delayFeedback: 0
          },
          binaural: {
            waveform: 'sine',
            carrierFrequency: 220,
            beatFrequency: 15,
            volume: 0.4
          }
        },
        
        // Melodic Presets
        arpeggiator: {
          name: 'Arpeggiator',
          description: 'Rhythmic arpeggiated patterns',
          parameters: {
            baseFrequency: 261.63, // C4 note
            volume: 0.45,
            binauralBeat: 0,
            harmonicRatios: [1, 1.25, 1.5, 2, 2.5, 3],
            tempo: 120,
            pulseRate: 4, // Sixteenth notes
            filterCutoff: 3000,
            filterResonance: 2,
            reverbDecay: 2,
            delayTime: 0.25,
            delayFeedback: 0.6
          },
          effects: {
            delay: {
              wet: 0.6,
              delayTime: 0.25,
              feedback: 0.6
            }
          }
        },
        
        chimes: {
          name: 'Chimes',
          description: 'Bell-like chime tones with random patterns',
          parameters: {
            baseFrequency: 523.25, // C5 note
            volume: 0.4,
            binauralBeat: 0,
            harmonicRatios: [1, 2, 3, 4, 5, 8],
            tempo: 60,
            pulseRate: 0.5,
            filterCutoff: 6000,
            filterResonance: 1,
            reverbDecay: 8,
            delayTime: 1.0,
            delayFeedback: 0.7
          },
          harmonics: {
            waveform: 'sine',
            amplitudes: [0.3, 0.6, 0.2, 0.4, 0.1, 0.05],
            detunes: [0, 0, 1, 0, 2, 1]
          }
        },
        
        harmonicSeries: {
          name: 'Harmonic Series',
          description: 'Pure harmonic series based on fundamental frequency',
          parameters: {
            baseFrequency: 110, // A2 note
            volume: 0.5,
            binauralBeat: 0,
            harmonicRatios: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 5000,
            filterResonance: 1,
            reverbDecay: 3,
            delayTime: 0.3,
            delayFeedback: 0.2
          },
          harmonics: {
            waveform: 'sine',
            amplitudes: [1.0, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12, 0.11, 0.1],
            detunes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        },
        
        bellTones: {
          name: 'Bell Tones',
          description: 'Rich bell-like tones with inharmonic partials',
          parameters: {
            baseFrequency: 220, // A3 note
            volume: 0.4,
            binauralBeat: 0,
            harmonicRatios: [1, 2.756, 5.404, 8.93],
            tempo: 30,
            pulseRate: 1,
            filterCutoff: 4000,
            filterResonance: 1,
            reverbDecay: 6,
            delayTime: 0.8,
            delayFeedback: 0.3
          }
        },
        
        morningDew: {
          name: 'Morning Dew',
          description: 'Bright, gentle melodic tones reminiscent of morning',
          parameters: {
            baseFrequency: 392, // G4 note
            volume: 0.35,
            binauralBeat: 8,
            harmonicRatios: [1, 1.5, 2, 3, 4],
            tempo: 70,
            pulseRate: 1,
            filterCutoff: 3500,
            filterResonance: 1,
            reverbDecay: 4,
            delayTime: 0.4,
            delayFeedback: 0.4
          }
        },
        
        // Experimental Presets
        noiseScape: {
          name: 'Noise Scape',
          description: 'Filtered noise textures with evolving patterns',
          parameters: {
            baseFrequency: 100,
            volume: 0.4,
            binauralBeat: 6.5,
            harmonicRatios: [1, 1.414, 1.732, 2, 2.236],
            tempo: 0,
            pulseRate: 0,
            filterCutoff: 1000,
            filterResonance: 8,
            reverbDecay: 5,
            delayTime: 0.6,
            delayFeedback: 0.7
          },
          effects: {
            filter: {
              type: 'bandpass',
              frequency: 1000,
              Q: 8
            }
          }
        },
        
        randomHarmonics: {
          name: 'Random Harmonics',
          description: 'Randomly shifting harmonic relationships',
          parameters: {
            baseFrequency: 146.83, // D3 note
            volume: 0.45,
            binauralBeat: 5,
            harmonicRatios: [1, 1.618, 2.618, 4.236],
            tempo: 40,
            pulseRate: 0.5,
            filterCutoff: 3000,
            filterResonance: 2,
            reverbDecay: 7,
            delayTime: 1.2,
            delayFeedback: 0.65
          }
        },
        
        glitchTones: {
          name: 'Glitch Tones',
          description: 'Digital glitch-like sounds with sharp transients',
          parameters: {
            baseFrequency: 440, // A4 note
            volume: 0.4,
            binauralBeat: 9,
            harmonicRatios: [1, 1.414, 2, 2.828, 4],
            tempo: 110,
            pulseRate: 2,
            filterCutoff: 8000,
            filterResonance: 10,
            reverbDecay: 1,
            delayTime: 0.15,
            delayFeedback: 0.8
          },
          effects: {
            filter: {
              type: 'highpass',
              frequency: 1000,
              Q: 5
            }
          }
        },
        
        microTones: {
          name: 'Micro Tones',
          description: 'Microtonal intervals and subtle variations',
          parameters: {
            baseFrequency: 261.63, // C4 note
            volume: 0.4,
            binauralBeat: 6.5,
            harmonicRatios: [1, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41],
            tempo: 60,
            pulseRate: 1,
            filterCutoff: 2000,
            filterResonance: 1,
            reverbDecay: 4,
            delayTime: 0.5,
            delayFeedback: 0.4
          }
        },
        
        chaosTheory: {
          name: 'Chaos Theory',
          description: 'Complex, unpredictable patterns based on chaos principles',
          parameters: {
            baseFrequency: 196, // G3 note
            volume: 0.45,
            binauralBeat: 11,
            harmonicRatios: [1, 1.5, 1.9, 2.4, 3.2, 4.1],
            tempo: 80,
            pulseRate: 1.5,
            filterCutoff: 2500,
            filterResonance: 5,
            reverbDecay: 6,
            delayTime: 0.666,
            delayFeedback: 0.75
          }
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
        parameters: {},
        binaural: {},
        harmonics: {},
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
        // Linear interpolation for numeric values
        if (typeof fromParams[key] === 'number' && typeof toParams[key] === 'number') {
          result.parameters[key] = fromParams[key] + (toParams[key] - fromParams[key]) * progress;
        }
        // Handle arrays (like harmonicRatios)
        else if (Array.isArray(fromParams[key]) && Array.isArray(toParams[key])) {
          // Get the union of array lengths
          const maxLength = Math.max(fromParams[key].length, toParams[key].length);
          result.parameters[key] = [];
          
          for (let i = 0; i < maxLength; i++) {
            // If both arrays have this index, interpolate
            if (i < fromParams[key].length && i < toParams[key].length) {
              result.parameters[key][i] = fromParams[key][i] + 
                (toParams[key][i] - fromParams[key][i]) * progress;
            }
            // Otherwise use whichever value is available
            else if (i < fromParams[key].length) {
              result.parameters[key][i] = fromParams[key][i];
            } else {
              result.parameters[key][i] = toParams[key][i];
            }
          }
        }
        // Copy non-numeric, non-array values directly based on progress threshold
        else {
          result.parameters[key] = progress < 0.5 ? 
            (fromParams[key] !== undefined ? fromParams[key] : toParams[key]) : 
            (toParams[key] !== undefined ? toParams[key] : fromParams[key]);
        }
      });
      
      // Handle binaural settings
      if (fromPreset.binaural && toPreset.binaural) {
        result.binaural = {};
        const fromBinaural = fromPreset.binaural;
        const toBinaural = toPreset.binaural;
        
        // Interpolate each binaural parameter
        Object.keys(fromBinaural).forEach(key => {
          if (typeof fromBinaural[key] === 'number' && typeof toBinaural[key] === 'number') {
            result.binaural[key] = fromBinaural[key] + (toBinaural[key] - fromBinaural[key]) * progress;
          } else {
            result.binaural[key] = progress < 0.5 ? fromBinaural[key] : toBinaural[key];
          }
        });
      } else if (fromPreset.binaural) {
        result.binaural = { ...fromPreset.binaural };
      } else if (toPreset.binaural) {
        result.binaural = { ...toPreset.binaural };
      }
      
      // Handle harmonics settings
      if (fromPreset.harmonics && toPreset.harmonics) {
        result.harmonics = {};
        const fromHarmonics = fromPreset.harmonics;
        const toHarmonics = toPreset.harmonics;
        
        // Interpolate each harmonics parameter
        Object.keys(fromHarmonics).forEach(key => {
          if (Array.isArray(fromHarmonics[key]) && Array.isArray(toHarmonics[key])) {
            // Interpolate arrays (amplitudes, detunes)
            const maxLength = Math.max(fromHarmonics[key].length, toHarmonics[key].length);
            result.harmonics[key] = [];
            
            for (let i = 0; i < maxLength; i++) {
              if (i < fromHarmonics[key].length && i < toHarmonics[key].length) {
                result.harmonics[key][i] = fromHarmonics[key][i] + 
                  (toHarmonics[key][i] - fromHarmonics[key][i]) * progress;
              } else if (i < fromHarmonics[key].length) {
                result.harmonics[key][i] = fromHarmonics[key][i];
              } else {
                result.harmonics[key][i] = toHarmonics[key][i];
              }
            }
          } else if (typeof fromHarmonics[key] === 'number' && typeof toHarmonics[key] === 'number') {
            result.harmonics[key] = fromHarmonics[key] + (toHarmonics[key] - fromHarmonics[key]) * progress;
          } else {
            result.harmonics[key] = progress < 0.5 ? fromHarmonics[key] : toHarmonics[key];
          }
        });
      } else if (fromPreset.harmonics) {
        result.harmonics = { ...fromPreset.harmonics };
      } else if (toPreset.harmonics) {
        result.harmonics = { ...toPreset.harmonics };
      }
      
      // Handle effects settings
      if (fromPreset.effects || toPreset.effects) {
        result.effects = {};
        const fromEffects = fromPreset.effects || {};
        const toEffects = toPreset.effects || {};
        
        // Get all effect types
        const effectTypes = new Set([
          ...Object.keys(fromEffects),
          ...Object.keys(toEffects)
        ]);
        
        // Process each effect type
        effectTypes.forEach(effectType => {
          if (fromEffects[effectType] && toEffects[effectType]) {
            // Both presets have this effect, interpolate settings
            result.effects[effectType] = {};
            const fromEffect = fromEffects[effectType];
            const toEffect = toEffects[effectType];
            
            // Get all parameters for this effect
            const effectParams = new Set([
              ...Object.keys(fromEffect),
              ...Object.keys(toEffect)
            ]);
            
            // Interpolate each parameter
            effectParams.forEach(param => {
              if (typeof fromEffect[param] === 'number' && typeof toEffect[param] === 'number') {
                result.effects[effectType][param] = fromEffect[param] + 
                  (toEffect[param] - fromEffect[param]) * progress;
              } else {
                result.effects[effectType][param] = progress < 0.5 ? fromEffect[param] : toEffect[param];
              }
            });
          } else if (fromEffects[effectType]) {
            // Only in 'from' preset, phase out based on progress
            result.effects[effectType] = {};
            Object.entries(fromEffects[effectType]).forEach(([param, value]) => {
              if (typeof value === 'number' && param === 'wet') {
                // Fade out wet parameter
                result.effects[effectType][param] = value * (1 - progress);
              } else {
                result.effects[effectType][param] = value;
              }
            });
          } else if (toEffects[effectType]) {
            // Only in 'to' preset, phase in based on progress
            result.effects[effectType] = {};
            Object.entries(toEffects[effectType]).forEach(([param, value]) => {
              if (typeof value === 'number' && param === 'wet') {
                // Fade in wet parameter
                result.effects[effectType][param] = value * progress;
              } else {
                result.effects[effectType][param] = value;
              }
            });
          }
        });
      }
      
      return result;
    }
  }
  
  export default AudioPresets;