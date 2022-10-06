import {transactionToPromise} from '../transactionToPromise';

interface Complete {

}

export class CompletedDb {
  private db: Promise<IDBDatabase> | undefined;

  set(gameId: string, data: Complete) {
    return this.dbPromise()
        .then(db => db.transaction('games', 'readwrite').objectStore('completed').put(data, gameId))
        .then(transactionToPromise);
  }

  private dbPromise() {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
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
    }
    return this.db;
  }
}
