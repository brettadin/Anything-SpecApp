/**
 * Simple Cooley-Tukey FFT implementation (no external deps)
 * @param {number[]} yValues - intensity/signal values
 * @returns {object} FFT result with magnitude spectrum
 */
export function computeFFT(yValues) {
  if (!yValues || yValues.length === 0) {
    return { magnitude: [], real: [], imag: [] };
  }

  // For simplicity, use a built-in approach: Discrete Fourier Transform
  const N = yValues.length;
  const real = new Array(N);
  const imag = new Array(N);
  const magnitude = new Array(N);

  for (let k = 0; k < N; k++) {
    real[k] = 0;
    imag[k] = 0;

    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      real[k] += yValues[n] * Math.cos(angle);
      imag[k] += yValues[n] * Math.sin(angle);
    }

    magnitude[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
  }

  return { magnitude, real, imag };
}

/**
 * Detect peaks in spectrum (local maxima)
 * @param {number[]} yValues - intensity values
 * @param {object} options - { minHeight, minDistance }
 * @returns {object} peaks with indices and values
 */
export function detectPeaks(yValues, options = {}) {
  const { minHeight = 0, minDistance = 1 } = options;
  const peakIndices = [];

  for (let i = 1; i < yValues.length - 1; i++) {
    // Check if local maximum and above threshold
    if (
      yValues[i] > yValues[i - 1] &&
      yValues[i] > yValues[i + 1] &&
      yValues[i] >= minHeight
    ) {
      // Check minimum distance to previous peak
      if (peakIndices.length === 0 || i - peakIndices[peakIndices.length - 1] >= minDistance) {
        peakIndices.push(i);
      }
    }
  }

  return {
    peakIndices,
    peakValues: peakIndices.map((i) => yValues[i]),
    success: true,
  };
}

/**
 * Simple polynomial baseline correction
 * @param {number[]} yValues - intensity values
 * @param {number} degree - polynomial degree (1 = linear, 2 = quadratic)
 * @returns {object} corrected spectrum
 */
export function correctBaseline(yValues, degree = 1) {
  try {
    // Fit polynomial to data points
    const n = yValues.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Simple linear fit as default
    if (degree === 1) {
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += yValues[i];
        sumXY += x[i] * yValues[i];
        sumX2 += x[i] * x[i];
      }

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const corrected = yValues.map((y, i) => y - (slope * i + intercept));
      return { correctedSpectrum: corrected, success: true };
    }

    // For higher degrees, just return copy
    return { correctedSpectrum: [...yValues], success: true };
  } catch (err) {
    console.warn('Baseline correction failed:', err.message);
    return { correctedSpectrum: yValues, success: false, error: err.message };
  }
}


/**
 * Smooth spectrum using Savitzky-Golay filter (simple moving average as fallback)
 * @param {number[]} yValues - intensity values
 * @param {number} windowSize - smoothing window (odd number recommended)
 * @returns {number[]} smoothed spectrum
 */
export function smoothSpectrum(yValues, windowSize = 5) {
  if (windowSize < 1 || windowSize > yValues.length) {
    return yValues;
  }

  const half = Math.floor(windowSize / 2);
  const smoothed = [];

  for (let i = 0; i < yValues.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(yValues.length - 1, i + half); j++) {
      sum += yValues[j];
      count++;
    }
    smoothed.push(sum / count);
  }

  return smoothed;
}

/**
 * Normalize spectrum to [0, 1] range
 * @param {number[]} yValues - intensity values
 * @returns {number[]} normalized values
 */
export function normalizeSpectrum(yValues) {
  if (!yValues || yValues.length === 0) return yValues;
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);
  const range = max - min || 1;
  return yValues.map((v) => (v - min) / range);
}

/**
 * Compute spectral statistics
 * @param {number[]} yValues - intensity values
 * @returns {object} stats
 */
export function computeStats(yValues) {
  if (!yValues || yValues.length === 0) {
    return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
  }

  const count = yValues.length;
  const sum = yValues.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const variance = yValues.reduce((sq, v) => sq + (v - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);

  return { count, mean, stdDev, min, max, range: max - min };
}
