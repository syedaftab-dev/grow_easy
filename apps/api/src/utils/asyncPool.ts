/**
 * Runs async tasks with a bounded concurrency limit.
 * Results are returned in the same order as the input items.
 *
 * @param concurrency - Max number of tasks to run simultaneously.
 * @param items       - Input items to process.
 * @param task        - Async function to apply to each item.
 */
export async function asyncPool<T, R>(
  concurrency: number,
  items: T[],
  task: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      // eslint-disable-next-line no-await-in-loop
      results[index] = await task(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
