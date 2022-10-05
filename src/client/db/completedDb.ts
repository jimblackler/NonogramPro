interface Complete {

}

export class CompletedDb {
  private db: Promise<IDBDatabase> | undefined;

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

  private withStore(type: IDBTransactionMode, callback: (value: IDBObjectStore) => void) {
    return this.dbPromise().then(db => new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('completed', type);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
      callback(transaction.objectStore('completed'));
    }));
  }

  set(gameId: string, data: Complete) {
    return this.withStore('readwrite', store => store.put(data, gameId));
  }

  list(handler: () => IDBRequest) {
    return this.withStore('readonly', store => {
      store.openCursor.call(store).onsuccess = handler;
    })
  }
}
