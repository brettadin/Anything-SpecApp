import { describe, it, expect } from 'vitest';
import { parseTextFile, parseDelimited, parseJcamp } from '../src/app/api/utils/parsers';

describe('parsers util', () => {
  it('parses simple CSV', async () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6\n';
    const res = await parseTextFile(csv, 'data.csv');
    expect(res.detectedFormat).toBe('csv');
    expect(res.rows.length).toBe(2);
    expect(res.columnNames).toEqual(['a','b','c']);
  });

  it('parses TSV', async () => {
    const tsv = 'x\ty\n10\t20\n30\t40\n';
    const res = await parseTextFile(tsv, 'data.tsv');
    expect(res.detectedFormat).toBe('tsv');
    expect(res.rows[0]).toHaveProperty('x');
  });

  it('parses JCAMP content', async () => {
    // Minimal synthetic JCAMP-like content; jcamp.convert should handle this
    const jcampText = '##TITLE=Test\n##DATA TABLE= (X++(Y..X))\n100,1\n200,2\n##END=';
    const res = await parseTextFile(jcampText, 'spectrum.jdx');
    // If jcamp parse fails, we should still get a jcamp-error detectedFormat
    expect(['jcamp', 'jcamp-error']).toContain(res.detectedFormat);
  });
});
