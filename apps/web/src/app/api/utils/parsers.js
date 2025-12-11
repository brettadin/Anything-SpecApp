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

// Parse JCAMP-DX using the `jcamp` package
export async function parseJcamp(text) {
  try {
    const jcamp = await import('jcamp');
    const parsed = (jcamp && jcamp.convert) ? jcamp.convert(text) : jcamp.default?.convert?.(text);
    // `jcamp.convert` returns an object with spectra array
    const spectra = (parsed && parsed.spectra) ? parsed.spectra : [];
    const rows = [];
    let columnNames = [];

    if (spectra.length > 0) {
      const sp = spectra[0];
      const x = sp.x || [];
      const y = sp.y || [];
      columnNames = ['x', 'y'];
      for (let i = 0; i < Math.min(x.length, y.length); i++) {
        rows.push({ x: x[i], y: y[i] });
      }
    }

    return {
      detectedFormat: 'jcamp',
      hasHeaders: true,
      delimiter: null,
      columnNames,
      rows,
      notes: [],
      metadataRows: [],
      spectralMetadata: parsed ? parsed.info || {} : {},
      xColumn: 'x',
      yColumns: ['y'],
      xRange: null,
      yRange: null,
      dataStartRow: 0,
    };
  } catch (err) {
    return {
      detectedFormat: 'jcamp-error',
      hasHeaders: false,
      delimiter: null,
      columnNames: [],
      rows: [],
      notes: [err.message],
      metadataRows: [],
      spectralMetadata: {},
      xColumn: null,
      yColumns: [],
      xRange: null,
      yRange: null,
      dataStartRow: 0,
    };
  }
}

// Generic parser that picks a parser based on filename or content
export async function parseTextFile(content, filename) {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'jdx' || ext === 'jcamp' || content.includes('##TITLE') || content.includes('##JCAMP')) {
    return await parseJcamp(content);
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
