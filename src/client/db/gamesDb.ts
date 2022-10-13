import {ClientGameData} from '../../common/clientGame';
import {requestToAsyncGenerator} from '../requestToAsyncGenerator';
import {transactionToPromise} from '../transactionToPromise';

const dbPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
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

export function setGame(gameId: string, data: ClientGameData) {
  return dbPromise
      .then(db => db.transaction('games', 'readwrite').objectStore('games').put(data, gameId))
      .then(transactionToPromise);
}

export function getGameDb(gameId: string) {
  return dbPromise
      .then(db => db.transaction('games', 'readonly').objectStore('games').get(gameId))
      .then(transactionToPromise)
      .then(result => result as ClientGameData);
}

export function listGames() {
  return dbPromise
      .then(db => db.transaction('games', 'readonly').objectStore('games').index('by_difficulty')
          .openCursor())
      .then(requestToAsyncGenerator);
}

export function deleteGame(gameId: string) {
  return dbPromise
      .then(db => db.transaction('games', 'readwrite').objectStore('games').delete(gameId))
      .then(transactionToPromise);
}
