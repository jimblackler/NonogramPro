export interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export const playsDb = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('plays-store', 1);
  request.onupgradeneeded = () =>
      request.result.createObjectStore('plays');
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
});
