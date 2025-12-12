import { describe, it, expect } from 'vitest';

/**
 * Integration tests for upload → parse → analyze pipeline
 * These test the full flow from file upload through spectral analysis
 */

describe('Upload + Analysis Pipeline', () => {
  // Mock data for testing
  const testCSVData = {
    content: 'wavelength,intensity\n400,10\n410,25\n420,50\n430,40\n440,15\n',
    filename: 'spectrum.csv',
    mimeType: 'text/csv',
  };

  it('parses CSV with headers correctly', async () => {
    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const result = await parseTextFile(testCSVData.content, testCSVData.filename);

    expect(result.detectedFormat).toBe('csv');
    expect(result.hasHeaders).toBe(true);
    expect(result.columnNames).toContain('wavelength');
    expect(result.columnNames).toContain('intensity');
    expect(result.rows.length).toBe(5);
  });

  it('detects X and Y columns in spectrum data', async () => {
    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const result = await parseTextFile(testCSVData.content, testCSVData.filename);

    // Should detect wavelength as X and intensity as Y
    expect(result.rows[0]).toHaveProperty('wavelength');
    expect(result.rows[0]).toHaveProperty('intensity');
    expect(typeof result.rows[0].wavelength).toBe('number');
    expect(typeof result.rows[0].intensity).toBe('number');
  });

  it('applies spectral analysis to parsed data', async () => {
    const {
      computeStats,
      normalizeSpectrum,
      detectPeaks,
      correctBaseline,
    } = await import('../src/app/api/utils/spectral-analysis');

    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const parsed = await parseTextFile(testCSVData.content, testCSVData.filename);
    const intensities = parsed.rows.map((r: any) => r.intensity);

    // Test stats
    const stats = computeStats(intensities) as any;
    expect(stats.mean).toBeGreaterThan(0);
    expect(stats.stdDev).toBeGreaterThanOrEqual(0);
    expect(stats.min).toBeLessThanOrEqual(stats.max);

    // Test normalization
    const normalized = normalizeSpectrum(intensities);
    expect(Math.max(...normalized)).toBeLessThanOrEqual(1);
    expect(Math.min(...normalized)).toBeGreaterThanOrEqual(0);

    // Test peak detection
    const peaks = detectPeaks(intensities, { minDistance: 1 }) as any;
    expect(peaks.peakIndices).toBeDefined();
    expect(peaks.peakValues).toBeDefined();
    expect(peaks.peakValues.length).toBeGreaterThan(0);

    // Test baseline correction
    const corrected = correctBaseline(intensities, 1) as any;
    expect(corrected.correctedSpectrum.length).toBe(intensities.length);
  });

  it('handles multiple Y columns', async () => {
    const multiYCSV = 'x,y1,y2\n1,10,20\n2,15,25\n3,12,22\n';
    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const result = await parseTextFile(multiYCSV, 'multi.csv');

    expect(result.columnNames).toContain('x');
    expect(result.columnNames).toContain('y1');
    expect(result.columnNames).toContain('y2');
    expect(result.rows.length).toBe(3);
    expect(result.rows[0]).toHaveProperty('y1');
    expect(result.rows[0]).toHaveProperty('y2');
  });

  it('handles TSV format', async () => {
    const tsvData = 'freq\tpower\n100\t5\n200\t10\n300\t8\n';
    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const result = await parseTextFile(tsvData, 'data.tsv');

    expect(result.detectedFormat).toBe('tsv');
    expect(result.columnNames.length).toBe(2);
    expect(result.rows.length).toBe(3);
  });

  it('extracts spectral metadata from key-value format', async () => {
    const metaCSV =
      'Source: Spectrometer XYZ\nDate: 2025-01-01\nwavelength,intensity\n400,10\n410,20\n';
    const { parseTextFile } = await import('../src/app/api/utils/parsers');
    const result = await parseTextFile(metaCSV, 'spectrum.csv');

    // Parser should skip metadata lines and extract column names from the header line
    expect(result.rows.length).toBeGreaterThan(0);
    // Column names may be extracted from first line or detected
    expect(result.columnNames.length).toBeGreaterThan(0);
  });

  it('computes FFT of spectrum', async () => {
    const intensities = [1, 2, 3, 4, 5, 4, 3, 2];
    const { computeFFT } = await import('../src/app/api/utils/spectral-analysis');
    const result = computeFFT(intensities) as any;

    expect(result.magnitude.length).toBe(intensities.length);
    expect(result.real.length).toBe(intensities.length);
    expect(result.imag.length).toBe(intensities.length);
    expect(result.magnitude[0]).toBeGreaterThan(0);
  });

  it('handles empty or minimal data gracefully', async () => {
    const { computeStats, detectPeaks } = await import('../src/app/api/utils/spectral-analysis');

    const empty: number[] = [];
    const statsEmpty = computeStats(empty) as any;
    expect(statsEmpty.count).toBe(0);

    const single = [5];
    const statsSingle = computeStats(single) as any;
    expect(statsSingle.count).toBe(1);
    expect(statsSingle.mean).toBe(5);

    const peaks = detectPeaks(single) as any;
    expect(peaks.peakIndices.length).toBe(0);
  });
});
