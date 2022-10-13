import {truthy} from '../truthy';

export const gamesDb: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open('games-store', 9);
  request.addEventListener('upgradeneeded', event => {
    let objectStore;
    if (event.oldVersion < 9) {
      if (request.result.objectStoreNames.contains('games')) {
        request.result.deleteObjectStore('games');
      }
      objectStore = request.result.createObjectStore('games');
      objectStore = truthy(request.transaction).objectStore('games');
      objectStore.createIndex('byDifficulty', 'difficulty');
    }
  });
  request.addEventListener('error', () => reject(request.error));
  request.addEventListener('success', () => resolve(request.result));
});
