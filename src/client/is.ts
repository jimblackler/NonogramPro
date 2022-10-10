export function is<T>(type: { new(...a: any[]): T }, object: any) {
  if (object instanceof type) {
    return object;
  }
  throw new Error();
}
