import Papa from 'papaparse';
// `jcamp` is dynamically imported to avoid startup failures if not installed


// Parse CSV/TSV and structured text using PapaParse
export function parseDelimited(text, delimiter = ',') {
  const result = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: delimiter === '\t' ? '\t' : delimiter,
  });

  const rows = result.data || [];
  const columnNames = result.meta && result.meta.fields ? result.meta.fields : [];

  return {
    detectedFormat: delimiter === '\t' ? 'tsv' : 'csv',
    hasHeaders: !!(result.meta && result.meta.fields && result.meta.fields.length > 0),
    delimiter: delimiter,
    columnNames,
    rows,
    notes: result.errors.length ? result.errors.map((e) => e.message) : [],
    metadataRows: [],
    spectralMetadata: {},
    xColumn: null,
    yColumns: [],
    xRange: null,
    yRange: null,
    dataStartRow: 0,
  };
}

// Parse JCAMP-DX (stub for now — jcamp package not reliably installed)
export async function parseJcamp(text) {
  // Return error state — users can upgrade when jcamp is properly installed
  return {
    detectedFormat: 'jcamp-not-available',
    hasHeaders: false,
    delimiter: null,
    columnNames: [],
    rows: [],
    notes: ['JCAMP parsing not available; please install jcamp package'],
    metadataRows: [],
    spectralMetadata: {},
    xColumn: null,
    yColumns: [],
    xRange: null,
    yRange: null,
    dataStartRow: 0,
  };
}

// Generic parser that picks a parser based on filename or content
export async function parseTextFile(content, filename) {
  const ext = filename.toLowerCase().split('.').pop();

  // JCAMP support (when jcamp package is available)
  if (ext === 'jdx' || ext === 'jcamp' || content.includes('##TITLE') || content.includes('##JCAMP')) {
    try {
      return await parseJcamp(content);
    } catch (err) {
      console.warn('JCAMP parsing failed, falling back to CSV:', err.message);
      // Fall through to CSV parsing
    }
  }

  // Try to detect delimiter using simple heuristics
  const sample = content.split('\n').slice(0, 10).join('\n');
  const counts = {
    ',': (sample.match(/,/g) || []).length,
    '\t': (sample.match(/\t/g) || []).length,
    ';': (sample.match(/;/g) || []).length,
    '|': (sample.match(/\|/g) || []).length,
  };

  let best = ',';
  let bestCount = counts[','];
  for (const d of Object.keys(counts)) {
    if (counts[d] > bestCount) {
      best = d;
      bestCount = counts[d];
    }
  }

  return parseDelimited(content, best);
}
