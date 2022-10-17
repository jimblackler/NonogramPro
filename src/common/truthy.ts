export function truthy<T>(object: T | null | undefined) {
  if (!object) {
    throw new Error();
  }
  return object;
}
