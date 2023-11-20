export function assertIs<T>(type: new(...a: never[]) => T, object: unknown) {
  if (object instanceof type) {
    return object;
  }
  throw new Error(`Expected ${object} to be of type ${type}`);
}
