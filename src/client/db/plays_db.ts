interface PlayInDb {
  on: boolean[][];
  off: boolean[][];
}

export class PlaysDb {
  private db: Promise<IDBDatabase> | undefined;

  withStore(type: IDBTransactionMode, callback: (value: IDBObjectStore) => void) {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const request = indexedDB.open('plays-store', 1);
        request.onupgradeneeded = () =>
            request.result.createObjectStore('plays');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    }

    return this.db.then(db => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('plays', type);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
        callback(transaction.objectStore('plays'));
      });
    });
  }

  set(game_id: string, data: PlayInDb) {
    return this.withStore('readwrite', store => store.put(data, game_id));
  }

  get(game_id: string) {
    let request: any;  // TODO: replace with local promise.
    return this.withStore('readonly', store => request = store.get(game_id))
        .then(() => request.result as PlayInDb);
  }

  list(handler: () => IDBRequest) {
    return this.withStore('readonly', store => {
      store.openCursor.call(store).onsuccess = handler;
    })
  }
}
