export function requestToAsyncGenerator(request: IDBRequest<IDBCursorWithValue | null>) {
  let fetchNext = () => {
  };
  const generator: AsyncGenerator<IDBCursorWithValue> = {
    next: () => new Promise((resolve, reject) => {
      request.onsuccess = ev => {
        const cursor = request.result;
        if (!cursor) {
          resolve({done: true, value: undefined});
          return;
        }
        if (!(cursor instanceof IDBCursorWithValue)) {
          throw new Error();
        }

        resolve({done: false, value: cursor});
        fetchNext = () => cursor.continue();
      };
      request.onerror = ev => {
        reject();  // TODO: work out how to report underlying exception.
      };
      fetchNext();
    }),
    return: (value: any) => new Promise((resolve, reject) => {
      throw new Error('Not yet implemented');
    }),
    throw: (e: any) => new Promise((resolve, reject) => {
      throw new Error('Not yet implemented');
    }),
    [Symbol.asyncIterator]: () => generator
  };
  return generator;
}
