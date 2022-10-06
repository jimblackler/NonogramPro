import {requestToAsyncGenerator} from '../requestToAsyncGenerator';
import {transactionToPromise} from '../transactionToPromise';

interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export class PlaysDb {
  private db: Promise<IDBDatabase> | undefined;

  set(gameId: string, data: PlayInDb) {
    return this.dbPromise()
        .then(db => db.transaction('plays', 'readwrite').objectStore('plays').put(data, gameId))
        .then(transactionToPromise);
  }

  get(gameId: string) {
    return this.dbPromise()
        .then(db => db.transaction('plays', 'readonly').objectStore('plays').get(gameId))
        .then(transactionToPromise)
        .then(result => result as PlayInDb);
  }

  list() {
    return this.dbPromise()
        .then(db => db.transaction('plays', 'readonly').objectStore('plays').openCursor())
        .then(requestToAsyncGenerator);
  }

  private dbPromise() {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const request = indexedDB.open('plays-store', 1);
        request.onupgradeneeded = () =>
            request.result.createObjectStore('plays');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    }

    return this.db;
  }
}
