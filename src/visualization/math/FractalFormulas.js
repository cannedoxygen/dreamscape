/**
 * FractalFormulas.js
 * 
 * A collection of fractal formulas and variations for different types of fractals.
 * Each formula defines how points iterate in complex or hypercomplex space.
 */

import { ComplexMath } from './ComplexMath';

export class FractalFormulas {
  /**
   * Standard Mandelbrot formula: z = z^2 + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value (seed point) [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static mandelbrot(z, c) {
    // Optimized version of z^2 + c
    const [zx, zy] = z;
    const [cx, cy] = c;
    
    return [
      zx * zx - zy * zy + cx,
      2 * zx * zy + cy
    ];
  }
  
  /**
   * Julia set formula: z = z^2 + K (where K is a fixed constant)
   * @param {Array} z - Current value [real, imag]
   * @param {Array} k - Julia constant [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static julia(z, k) {
    // Same formula as mandelbrot, but k is fixed for all points
    return this.mandelbrot(z, k);
  }
  
  /**
   * Burning Ship fractal: z = (|Re(z)| + i|Im(z)|)^2 + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static burningShip(z, c) {
    const [zx, zy] = z;
    const [cx, cy] = c;
    
    // Take absolute values before squaring
    const absZx = Math.abs(zx);
    const absZy = Math.abs(zy);
    
    return [
      absZx * absZx - absZy * absZy + cx,
      2 * absZx * absZy + cy
    ];
  }
  
  /**
   * Tricorn (Mandelbar) fractal: z = (z*)^2 + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static tricorn(z, c) {
    const [zx, zy] = z;
    const [cx, cy] = c;
    
    // Complex conjugate: z* = (zx, -zy)
    return [
      zx * zx - zy * zy + cx,
      -2 * zx * zy + cy
    ];
  }
  
  /**
   * General power formula: z = z^power + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @param {number} power - Power to raise z to
   * @returns {Array} - Next value [real, imag]
   */
  static power(z, c, power) {
    // Use ComplexMath for non-integer powers
    const raised = ComplexMath.pow(z, power);
    return ComplexMath.add(raised, c);
  }
  
  /**
   * Newton fractal formula for f(z) = z^3 - 1
   * @param {Array} z - Current value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static newton(z) {
    const [zx, zy] = z;
    
    // Calculate z^3
    const z3x = zx * (zx * zx - 3 * zy * zy);
    const z3y = zy * (3 * zx * zx - zy * zy);
    
    // Denominator: 3 * z^2
    const denomX = 3 * (zx * zx - zy * zy);
    const denomY = 6 * zx * zy;
    
    // Calculate (z^3 - 1) / (3 * z^2)
    const denom = denomX * denomX + denomY * denomY;
    
    // z - (z^3 - 1) / (3 * z^2)
    return [
      zx - ((z3x - 1) * denomX + z3y * denomY) / denom,
      zy - (z3y * denomX - (z3x - 1) * denomY) / denom
    ];
  }
  
  /**
   * Lambda fractal (also known as "Phoenix" fractal)
   * z_(n+1) = z_n^2 + c * z_(n-1) + p
   * @param {Array} z - Current value [real, imag]
   * @param {Array} zPrev - Previous value [real, imag]
   * @param {Array} c - Lambda parameter [real, imag]
   * @param {Array} p - Phoenix parameter [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static phoenix(z, zPrev, c, p) {
    const [zx, zy] = z;
    const [px, py] = zPrev;
    const [cx, cy] = c;
    const [paramX, paramY] = p;
    
    // z^2
    const z2x = zx * zx - zy * zy;
    const z2y = 2 * zx * zy;
    
    // c * zPrev
    const czx = cx * px - cy * py;
    const czy = cx * py + cy * px;
    
    // z^2 + c * zPrev + p
    return [
      z2x + czx + paramX,
      z2y + czy + paramY
    ];
  }
  
  /**
   * Sine fractal: z = sin(z) + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static sine(z, c) {
    const sinZ = ComplexMath.sin(z);
    return ComplexMath.add(sinZ, c);
  }
  
  /**
   * Hyperbolic cosine fractal: z = cosh(z) + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static cosh(z, c) {
    const [zx, zy] = z;
    
    // cosh(z) = cos(zy) * cosh(zx) + i * sin(zy) * sinh(zx)
    const coshZx = ComplexMath.cosh(zx);
    const sinhZx = ComplexMath.sinh(zx);
    
    const result = [
      Math.cos(zy) * coshZx,
      Math.sin(zy) * sinhZx
    ];
    
    return ComplexMath.add(result, c);
  }
  
  /**
   * Magnet fractal type 1: z = ((z^2 + c - 1) / (2z + c - 2))^2
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static magnet1(z, c) {
    // z^2
    const z2 = ComplexMath.square(z);
    
    // z^2 + c - 1
    const numerator = ComplexMath.subtract(
      ComplexMath.add(z2, c),
      [1, 0]
    );
    
    // 2z + c - 2
    const denominator = ComplexMath.subtract(
      ComplexMath.add(
        ComplexMath.multiply([2, 0], z),
        c
      ),
      [2, 0]
    );
    
    // (z^2 + c - 1) / (2z + c - 2)
    const fraction = ComplexMath.divide(numerator, denominator);
    
    // ((z^2 + c - 1) / (2z + c - 2))^2
    return ComplexMath.square(fraction);
  }
  
  /**
   * Celtic fractal: z = abs(Re(z^2)) + i * abs(Im(z^2)) + c
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Constant value [real, imag]
   * @returns {Array} - Next value [real, imag]
   */
  static celtic(z, c) {
    const [zx, zy] = z;
    const [cx, cy] = c;
    
    // Calculate z^2
    const z2x = zx * zx - zy * zy;
    const z2y = 2 * zx * zy;
    
    // Take absolute values
    return [
      Math.abs(z2x) + cx,
      Math.abs(z2y) + cy
    ];
  }
  
  /**
   * Spider fractal (variation of Mandelbrot)
   * z_(n+1) = z_n^2 + c, c_(n+1) = c_n / 2 + z_n
   * @param {Array} z - Current value [real, imag]
   * @param {Array} c - Current c value [real, imag]
   * @returns {Object} - Next z and c values {z: [real, imag], c: [real, imag]}
   */
  static spider(z, c) {
    // Calculate next z
    const [zx, zy] = z;
    const [cx, cy] = c;
    
    const nextZ = [
      zx * zx - zy * zy + cx,
      2 * zx * zy + cy
    ];
    
    // Update c
    const nextC = [
      cx / 2 + nextZ[0],
      cy / 2 + nextZ[1]
    ];
    
    return { z: nextZ, c: nextC };
  }
  
  /**
   * Get a named fractal formula function
   * @param {string} name - Formula name
   * @returns {Function} - Formula function
   */
  static getFormula(name) {
    const formulas = {
      'mandelbrot': this.mandelbrot,
      'julia': this.julia,
      'burningShip': this.burningShip,
      'tricorn': this.tricorn,
      'newton': this.newton,
      'sine': this.sine,
      'cosh': this.cosh,
      'magnet1': this.magnet1,
      'celtic': this.celtic
    };
    
    return formulas[name] || this.mandelbrot;
  }
  
  /**
   * Check if a point escapes for a given formula
   * @param {string} formula - Formula name
   * @param {Array} c - Constant value [real, imag]
   * @param {Object} options - Options like maxIterations, escapeRadius, etc.
   * @returns {Object} - Escape information {escaped: boolean, iterations: number}
   */
  static checkEscape(formula, c, options = {}) {
    const {
      maxIterations = 100,
      escapeRadius = 2,
      juliaConstant = [-0.7, 0.27],
      power = 2
    } = options;
    
    const escapeRadiusSq = escapeRadius * escapeRadius;
    let z = [0, 0];
    let zPrev = [0, 0];
    let iterations = 0;
    
    // Get the formula function
    const formulaFn = this.getFormula(formula);
    
    while (iterations < maxIterations) {
      // Special case for Phoenix fractal
      if (formula === 'phoenix') {
        const result = this.phoenix(z, zPrev, juliaConstant, c);
        zPrev = z;
        z = result;
      } 
      // Special case for spider fractal
      else if (formula === 'spider') {
        const result = this.spider(z, c);
        z = result.z;
        c = result.c;
      }
      // Power formula
      else if (formula === 'power') {
        z = this.power(z, c, power);
      }
      // Newton fractal
      else if (formula === 'newton') {
        z = this.newton(z);
      }
      // Julia set
      else if (formula === 'julia') {
        z = formulaFn(z, juliaConstant);
      }
      // Standard formulas
      else {
        z = formulaFn(z, c);
      }
      
      // Check for escape
      const zMagSq = z[0] * z[0] + z[1] * z[1];
      if (zMagSq > escapeRadiusSq) {
        return { escaped: true, iterations, z, magnitude: Math.sqrt(zMagSq) };
      }
      
      iterations++;
    }
    
    // Didn't escape within max iterations
    return { escaped: false, iterations, z, magnitude: Math.sqrt(z[0] * z[0] + z[1] * z[1]) };
  }
  
  /**
   * Calculate a "smooth" iteration count for coloring
   * @param {number} iterations - Raw iteration count
   * @param {Array} z - Final z value [real, imag]
   * @param {number} maxIterations - Maximum iterations
   * @returns {number} - Smooth iteration count
   */
  static smoothIterations(iterations, z, maxIterations) {
    if (iterations >= maxIterations) return iterations;
    
    const [zx, zy] = z;
    const zMagSq = zx * zx + zy * zy;
    
    // Smooth coloring formula
    const log_zn = Math.log(zMagSq) / 2;
    const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
    
    return iterations + 1 - nu;
  }
}

export default FractalFormulas;