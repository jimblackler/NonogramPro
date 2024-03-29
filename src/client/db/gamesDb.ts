export const gamesDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('games-store', 16);
  request.addEventListener('upgradeneeded', event => {
    if (event.oldVersion < 16) {
      if (request.result.objectStoreNames.contains('games')) {
        request.result.deleteObjectStore('games');
      }
      request.result.createObjectStore('games').createIndex('byDifficulty', 'difficulty');
    }
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});
