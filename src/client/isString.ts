export function isString(object: any) {
  if (typeof object !== 'string') {
    throw new Error();
  }
  return object;
}
