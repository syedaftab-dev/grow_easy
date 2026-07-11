/**
 * Splits an array into sequential chunks of a given size.
 * The last chunk may be smaller than `size`.
 *
 * @example
 * chunkArray([1,2,3,4,5], 2) // → [[1,2],[3,4],[5]]
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new RangeError('chunkArray: size must be > 0');
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
