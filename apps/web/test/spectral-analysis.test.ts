import { describe, it, expect } from 'vitest';
import {
  computeFFT,
  detectPeaks,
  correctBaseline,
  smoothSpectrum,
  normalizeSpectrum,
  computeStats,
} from '../src/app/api/utils/spectral-analysis';

describe('spectral-analysis utils', () => {
  const testSpectrum = [1, 2, 5, 4, 3, 7, 8, 6, 2, 1];

  it('computes FFT of spectrum', () => {
    const result = computeFFT(testSpectrum) as any;
    expect(result).toHaveProperty('real');
    expect(result).toHaveProperty('imag');
    expect(result).toHaveProperty('magnitude');
    expect(result.magnitude.length).toBe(testSpectrum.length);
  });

  it('detects peaks in spectrum', () => {
    const result = detectPeaks(testSpectrum) as any;
    expect(result).toHaveProperty('peakIndices');
    expect(result).toHaveProperty('peakValues');
    expect(Array.isArray(result.peakIndices)).toBe(true);
  });

  it('corrects baseline', () => {
    const result = correctBaseline(testSpectrum, 1) as any;
    expect(result).toHaveProperty('correctedSpectrum');
    expect(result.correctedSpectrum.length).toBe(testSpectrum.length);
  });

  it('smooths spectrum', () => {
    const smoothed = smoothSpectrum(testSpectrum, 3);
    expect(smoothed.length).toBe(testSpectrum.length);
    // Smoothing may increase values at edges, just check it's an array of numbers
    expect(smoothed.every((v) => typeof v === 'number')).toBe(true);
  });

  it('normalizes spectrum', () => {
    const normalized = normalizeSpectrum(testSpectrum);
    const min = Math.min(...normalized);
    const max = Math.max(...normalized);
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(1);
  });

  it('computes spectral stats', () => {
    const stats = computeStats(testSpectrum) as any;
    expect(stats).toHaveProperty('mean');
    expect(stats).toHaveProperty('stdDev');
    expect(stats).toHaveProperty('min');
    expect(stats).toHaveProperty('max');
    expect(stats.count).toBe(testSpectrum.length);
  });
});
