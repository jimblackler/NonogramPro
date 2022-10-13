export interface Complete {
  completed: true;
}

export const completedDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('completed-store', 1);
  request.addEventListener('upgradeneeded', event => {
    let objectStore;
    if (event.oldVersion < 1) {
      objectStore = request.result.createObjectStore('completed');
    }
    return objectStore;
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});






