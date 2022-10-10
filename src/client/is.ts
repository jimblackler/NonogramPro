export function is<T>(object: any, type:{new(...a:any[]):T}) {
  if (object instanceof type) {
    return object;
  }
  throw new Error();
}
