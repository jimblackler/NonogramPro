export interface Complete {
  completed: true;
}

export const completedDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('completed-store', 3);
  request.addEventListener('upgradeneeded', event => {
    if (event.oldVersion < 3) {
      if (request.result.objectStoreNames.contains('completed')) {
        request.result.deleteObjectStore('completed');
      }
      request.result.createObjectStore('completed');
    }
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});






