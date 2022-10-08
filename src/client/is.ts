export function is(object: any, type: any) {
  if (object instanceof type) {
    return object;
  }
  throw new Error();
}
