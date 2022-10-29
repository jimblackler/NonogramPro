export interface Complete {
  completed: true;
}

export const completedDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('completed-store', 2);
  request.addEventListener('upgradeneeded', event => {
    if (event.oldVersion < 13) {
      if (request.result.objectStoreNames.contains('completed')) {
        request.result.deleteObjectStore('completed');
      }
      request.result.createObjectStore('completed');
    }
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});






