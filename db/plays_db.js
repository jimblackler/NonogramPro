'use strict';

class PlaysDb {
  withStore(type, callback) {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const request = indexedDB.open('plays-store', 1);
        request.onupgradeneeded =
            () => request.result.createObjectStore('plays');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    }

    return this.db.then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('plays', type);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
        callback(transaction.objectStore('plays'));
      });
    });
  }

  set(game_id, data) {
    return this.withStore('readwrite', store => store.put(data, game_id));
  }

  get(game_id) {
    let request;
    return this.withStore('readonly', store => request = store.get(game_id))
        .then(() => request.result);
  }

  list(handler) {
    return this.withStore('readonly', store => {
      store.openCursor.call(store).onsuccess = handler;
    })
  }
}