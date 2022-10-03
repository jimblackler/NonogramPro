export class CompletedDb {
  withStore(type, callback) {
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

    return this.db.then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('completed', type);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
        callback(transaction.objectStore('completed'));
      });
    });
  }

  set(game_id, data) {
    return this.withStore('readwrite', store => store.put(data, game_id));
  }

  list(handler) {
    return this.withStore('readonly', store => {
      store.openCursor.call(store).onsuccess = handler;
    })
  }
}