export function notNull<T>(object: T | null) {
  if (object === null) {
    throw new Error();
  }
  return object;
}
