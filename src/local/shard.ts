export function shard<T>(original: T[], length: number) {
  const fragments: T[][] = [];
  for (let idx = 0; idx < original.length; idx += length) {
    fragments.push(original.slice(idx, idx + length));
  }
  return fragments;
}
