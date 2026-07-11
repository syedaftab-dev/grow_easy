import Papa from 'papaparse';

export type RawRecord = Record<string, string>;

/**
 * Parses a CSV string into an array of raw key-value records.
 * - Headers are trimmed of whitespace.
 * - Cell values are trimmed of whitespace.
 * - Empty lines are skipped.
 * - Parse warnings are logged but do not throw — partial data is returned.
 */
export function parseCsv(csvText: string): RawRecord[] {
  const result = Papa.parse<RawRecord>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    console.warn(
      '[csv] Parse warnings (first 5):',
      result.errors.slice(0, 5).map((e) => e.message),
    );
  }

  return result.data;
}
