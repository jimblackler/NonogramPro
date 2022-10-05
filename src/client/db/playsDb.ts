interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export class PlaysDb {
  private db: Promise<IDBDatabase> | undefined;

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

  private withStore(type: IDBTransactionMode, callback: (value: IDBObjectStore) => void) {
    return this.dbPromise().then(db => new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('plays', type);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
      callback(transaction.objectStore('plays'));
    }));
  }

  set(gameId: string, data: PlayInDb) {
    return this.withStore('readwrite', store => store.put(data, gameId));
  }

  get(gameId: string) {
    let request: any;  // TODO: replace with local promise.
    return this.withStore('readonly', store => request = store.get(gameId))
        .then(() => request.result as PlayInDb);
  }

  list(handler: (ev: Event) => void) {
    return this.withStore('readonly', store => {
      store.openCursor.call(store).onsuccess = handler;
    })
  }
}
