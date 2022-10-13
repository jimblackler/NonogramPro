export interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export const playsDb = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('plays-store', 1);
  request.addEventListener('upgradeneeded', () => request.result.createObjectStore('plays'));
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});
