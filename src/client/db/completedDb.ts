export interface Complete {
  completed: true;
}

export const completedDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('completed-store', 1);
  request.onupgradeneeded = (event) => {
    let objectStore;
    if (event.oldVersion < 1) {
      objectStore = request.result.createObjectStore('completed');
    }
    return objectStore;
  };
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
});






