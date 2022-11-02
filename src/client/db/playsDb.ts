export interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export const playsDb = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('plays-store', 2);
  request.addEventListener('upgradeneeded', event => {
    if (event.oldVersion < 2) {
      if (request.result.objectStoreNames.contains('plays')) {
        request.result.deleteObjectStore('plays');
      }
      request.result.createObjectStore('plays');
    }
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});
