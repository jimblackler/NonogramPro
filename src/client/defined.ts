export function defined<T>(object: T | undefined) {
  if (object === undefined) {
    throw new Error();
  }
  return object;
}
