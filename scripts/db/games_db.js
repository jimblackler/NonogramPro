'use strict';

class GamesDb {
  withStore(type, callback) {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const request = indexedDB.open('games-store', 2);
        request.onupgradeneeded =
            (event) => {
              let objectStore;
              if (event.oldVersion < 1) {
                objectStore = request.result.createObjectStore('games');
              }
              if (event.oldVersion < 2) {
                objectStore = request.transaction.objectStore('games');
                objectStore.createIndex('by_difficulty', 'difficulty');
              }
              return objectStore;
            };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    }

    return this.db.then(db => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('games', type);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
        callback(transaction.objectStore('games'));
      });
    });
  }

  set(game_id, data) {
    return this.withStore('readwrite', store => store.put(data, game_id));
  }

  get(game_id) {
    let request;
    return this.withStore('readonly',
        store => request = store.get(game_id)).then(() => request.result);
  }

  list(handler) {
    return this.withStore('readonly', store => {
      store.index('by_difficulty').openCursor().onsuccess = handler;
    })
  }

  delete_item(game_id) {
    return this.withStore('readwrite', store => store.delete(game_id));
  }
}