export const gamesDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('games-store', 2);
  request.onupgradeneeded = (event) => {
    let objectStore;
    if (event.oldVersion < 1) {
      objectStore = request.result.createObjectStore('games');
    }
    if (event.oldVersion < 2) {
      const transaction = request.transaction;
      if (!transaction) {
        throw new Error();
      }
      objectStore = transaction.objectStore('games');
      objectStore.createIndex('by_difficulty', 'difficulty');
    }
    return objectStore;
  };
  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
});
