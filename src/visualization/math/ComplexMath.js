/**
 * ComplexMath.js
 * 
 * Provides mathematical operations for complex numbers and fractal calculations.
 * Optimized for performance in fractal generation.
 */

export class ComplexMath {
    /**
     * Add two complex numbers
     * @param {Array|Object} a - First complex number as [real, imag] or {re, im}
     * @param {Array|Object} b - Second complex number as [real, imag] or {re, im}
     * @returns {Array} - Result as [real, imag]
     */
    static add(a, b) {
      const [a_re, a_im] = this._toArray(a);
      const [b_re, b_im] = this._toArray(b);
      
      return [a_re + b_re, a_im + b_im];
    }
    
    /**
     * Subtract complex numbers (a - b)
     * @param {Array|Object} a - First complex number
     * @param {Array|Object} b - Second complex number
     * @returns {Array} - Result as [real, imag]
     */
    static subtract(a, b) {
      const [a_re, a_im] = this._toArray(a);
      const [b_re, b_im] = this._toArray(b);
      
      return [a_re - b_re, a_im - b_im];
    }
    
    /**
     * Multiply complex numbers
     * @param {Array|Object} a - First complex number
     * @param {Array|Object} b - Second complex number
     * @returns {Array} - Result as [real, imag]
     */
    static multiply(a, b) {
      const [a_re, a_im] = this._toArray(a);
      const [b_re, b_im] = this._toArray(b);
      
      // (a_re + a_im*i) * (b_re + b_im*i)
      return [
        a_re * b_re - a_im * b_im,
        a_re * b_im + a_im * b_re
      ];
    }
    
    /**
     * Divide complex numbers (a / b)
     * @param {Array|Object} a - First complex number
     * @param {Array|Object} b - Second complex number
     * @returns {Array} - Result as [real, imag]
     */
    static divide(a, b) {
      const [a_re, a_im] = this._toArray(a);
      const [b_re, b_im] = this._toArray(b);
      
      // Denominator
      const denom = b_re * b_re + b_im * b_im;
      
      // Division formula: (a_re + a_im*i) / (b_re + b_im*i)
      return [
        (a_re * b_re + a_im * b_im) / denom,
        (a_im * b_re - a_re * b_im) / denom
      ];
    }
    
    /**
     * Calculate the square of a complex number
     * @param {Array|Object} z - Complex number
     * @returns {Array} - Result as [real, imag]
     */
    static square(z) {
      const [re, im] = this._toArray(z);
      
      // Optimized squaring: (re + im*i)^2
      return [re * re - im * im, 2 * re * im];
    }
    
    /**
     * Raise a complex number to a power
     * @param {Array|Object} z - Complex number
     * @param {number} power - Power (can be non-integer)
     * @returns {Array} - Result as [real, imag]
     */
    static pow(z, power) {
      const [re, im] = this._toArray(z);
      
      // Use polar form for power
      const r = Math.sqrt(re * re + im * im);
      
      // Handle zero case
      if (r === 0) return [0, 0];
      
      const theta = Math.atan2(im, re);
      const newR = Math.pow(r, power);
      const newTheta = theta * power;
      
      return [
        newR * Math.cos(newTheta),
        newR * Math.sin(newTheta)
      ];
    }
    
    /**
     * Calculate the absolute value (magnitude) of a complex number
     * @param {Array|Object} z - Complex number
     * @returns {number} - Absolute value
     */
    static abs(z) {
      const [re, im] = this._toArray(z);
      return Math.sqrt(re * re + im * im);
    }
    
    /**
     * Calculate the argument (phase angle) of a complex number
     * @param {Array|Object} z - Complex number
     * @returns {number} - Argument in radians
     */
    static arg(z) {
      const [re, im] = this._toArray(z);
      return Math.atan2(im, re);
    }
    
    /**
     * Calculate complex exponential (e^z)
     * @param {Array|Object} z - Complex number
     * @returns {Array} - Result as [real, imag]
     */
    static exp(z) {
      const [re, im] = this._toArray(z);
      const expReal = Math.exp(re);
      
      return [
        expReal * Math.cos(im),
        expReal * Math.sin(im)
      ];
    }
    
    /**
     * Calculate complex logarithm (natural log)
     * @param {Array|Object} z - Complex number
     * @returns {Array} - Result as [real, imag]
     */
    static log(z) {
      const [re, im] = this._toArray(z);
      
      return [
        Math.log(Math.sqrt(re * re + im * im)),
        Math.atan2(im, re)
      ];
    }
    
    /**
     * Calculate complex sine
     * @param {Array|Object} z - Complex number
     * @returns {Array} - Result as [real, imag]
     */
    static sin(z) {
      const [re, im] = this._toArray(z);
      
      return [
        Math.sin(re) * Math.cosh(im),
        Math.cos(re) * Math.sinh(im)
      ];
    }
    
    /**
     * Calculate complex cosine
     * @param {Array|Object} z - Complex number
     * @returns {Array} - Result as [real, imag]
     */
    static cos(z) {
      const [re, im] = this._toArray(z);
      
      return [
        Math.cos(re) * Math.cosh(im),
        -Math.sin(re) * Math.sinh(im)
      ];
    }
    
    /**
     * Calculate hyperbolic sine for real numbers
     * @param {number} x - Real number
     * @returns {number} - Hyperbolic sine
     */
    static sinh(x) {
      return (Math.exp(x) - Math.exp(-x)) / 2;
    }
    
    /**
     * Calculate hyperbolic cosine for real numbers
     * @param {number} x - Real number
     * @returns {number} - Hyperbolic cosine
     */
    static cosh(x) {
      return (Math.exp(x) + Math.exp(-x)) / 2;
    }
    
    /**
     * Convert complex number to array format [real, imag]
     * @param {Array|Object} z - Complex number as array or object
     * @returns {Array} - Complex number as [real, imag]
     * @private
     */
    static _toArray(z) {
      if (Array.isArray(z)) {
        return z;
      } else if (typeof z === 'object') {
        // Handle {re, im} or {real, imag} format
        const re = z.re !== undefined ? z.re : (z.real !== undefined ? z.real : 0);
        const im = z.im !== undefined ? z.im : (z.imag !== undefined ? z.imag : 0);
        return [re, im];
      } else if (typeof z === 'number') {
        // Treat as real number
        return [z, 0];
      }
      
      // Default
      return [0, 0];
    }
    
    /**
     * Generate the Mandelbrot set for a region
     * @param {Object} options - Generation options
     * @returns {Uint8Array} - Array of iteration counts
     */
    static generateMandelbrot({
      width = 800,
      height = 600,
      centerX = 0,
      centerY = 0,
      zoom = 1,
      maxIterations = 100,
      escapeRadius = 2,
      exponent = 2
    } = {}) {
      // Create result array
      const result = new Uint8Array(width * height);
      
      // Squared escape radius for optimization
      const escapeRadiusSq = escapeRadius * escapeRadius;
      
      // Calculate bounds
      const scale = 1 / zoom;
      const aspectRatio = width / height;
      const xmin = centerX - scale * aspectRatio;
      const xmax = centerX + scale * aspectRatio;
      const ymin = centerY - scale;
      const ymax = centerY + scale;
      
      // X and Y step size
      const dx = (xmax - xmin) / width;
      const dy = (ymax - ymin) / height;
      
      // Main iteration loop
      for (let y = 0; y < height; y++) {
        const cy = ymin + y * dy;
        
        for (let x = 0; x < width; x++) {
          const cx = xmin + x * dx;
          
          let zx = 0;
          let zy = 0;
          let iteration = 0;
          
          // Check if point is in main cardioid or period-2 bulb for optimization
          if (this._isInMainCardioid(cx, cy) || this._isInPeriod2Bulb(cx, cy)) {
            result[y * width + x] = maxIterations;
            continue;
          }
          
          // Main iteration loop for this pixel
          while (zx * zx + zy * zy < escapeRadiusSq && iteration < maxIterations) {
            // For standard Mandelbrot (exponent=2), use optimized calculation
            if (exponent === 2) {
              const zx_temp = zx * zx - zy * zy + cx;
              zy = 2 * zx * zy + cy;
              zx = zx_temp;
            } else {
              // For non-standard exponents, use complex power
              const r = Math.sqrt(zx * zx + zy * zy);
              const theta = Math.atan2(zy, zx);
              
              const newR = Math.pow(r, exponent);
              const newTheta = theta * exponent;
              
              zx = newR * Math.cos(newTheta) + cx;
              zy = newR * Math.sin(newTheta) + cy;
            }
            
            iteration++;
          }
          
          result[y * width + x] = iteration;
        }
      }
      
      return result;
    }
    
    /**
     * Generate the Julia set for a region
     * @param {Object} options - Generation options
     * @returns {Uint8Array} - Array of iteration counts
     */
    static generateJulia({
      width = 800,
      height = 600,
      centerX = 0,
      centerY = 0,
      juliaReal = -0.7,
      juliaImag = 0.27,
      zoom = 1,
      maxIterations = 100,
      escapeRadius = 2,
      exponent = 2
    } = {}) {
      // Create result array
      const result = new Uint8Array(width * height);
      
      // Squared escape radius for optimization
      const escapeRadiusSq = escapeRadius * escapeRadius;
      
      // Calculate bounds
      const scale = 1 / zoom;
      const aspectRatio = width / height;
      const xmin = centerX - scale * aspectRatio;
      const xmax = centerX + scale * aspectRatio;
      const ymin = centerY - scale;
      const ymax = centerY + scale;
      
      // X and Y step size
      const dx = (xmax - xmin) / width;
      const dy = (ymax - ymin) / height;
      
      // Main iteration loop
      for (let y = 0; y < height; y++) {
        const zy0 = ymin + y * dy;
        
        for (let x = 0; x < width; x++) {
          const zx0 = xmin + x * dx;
          
          let zx = zx0;
          let zy = zy0;
          let iteration = 0;
          
          // Main iteration loop for this pixel
          while (zx * zx + zy * zy < escapeRadiusSq && iteration < maxIterations) {
            // For standard Julia (exponent=2), use optimized calculation
            if (exponent === 2) {
              const zx_temp = zx * zx - zy * zy + juliaReal;
              zy = 2 * zx * zy + juliaImag;
              zx = zx_temp;
            } else {
              // For non-standard exponents, use complex power
              const r = Math.sqrt(zx * zx + zy * zy);
              const theta = Math.atan2(zy, zx);
              
              const newR = Math.pow(r, exponent);
              const newTheta = theta * exponent;
              
              zx = newR * Math.cos(newTheta) + juliaReal;
              zy = newR * Math.sin(newTheta) + juliaImag;
            }
            
            iteration++;
          }
          
          result[y * width + x] = iteration;
        }
      }
      
      return result;
    }
    
    /**
     * Check if a point is in the main cardioid of the Mandelbrot set
     * @param {number} x - Real component
     * @param {number} y - Imaginary component
     * @returns {boolean} - True if in main cardioid
     * @private
     */
    static _isInMainCardioid(x, y) {
      const q = (x - 0.25) * (x - 0.25) + y * y;
      return q * (q + (x - 0.25)) < 0.25 * y * y;
    }
    
    /**
     * Check if a point is in the period-2 bulb of the Mandelbrot set
     * @param {number} x - Real component
     * @param {number} y - Imaginary component
     * @returns {boolean} - True if in period-2 bulb
     * @private
     */
    static _isInPeriod2Bulb(x, y) {
      const xPlusOne = x + 1;
      return xPlusOne * xPlusOne + y * y < 0.0625;
    }
  }
  
  export default ComplexMath;