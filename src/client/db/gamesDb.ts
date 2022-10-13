export const gamesDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('games-store', 5);
  request.addEventListener('upgradeneeded', event => {
    let objectStore;
    if (event.oldVersion < 1) {
      objectStore = request.result.createObjectStore('games');
    }
    if (event.oldVersion < 3) {
      const transaction = request.transaction;
      if (!transaction) {
        throw new Error();
      }
      objectStore = transaction.objectStore('games');
      objectStore.createIndex('byDifficulty', 'difficulty');
    }
    return objectStore;
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});
