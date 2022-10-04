import {ClientGame, ClientGameData} from '../../common/clientGame';

export class GamesDb {
  private db: Promise<IDBDatabase> | undefined;

  withStore(type: IDBTransactionMode, callback: (value: IDBObjectStore) => void) {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
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
    }

    return this.db.then(db => {
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('games', type);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();
        callback(transaction.objectStore('games'));
      });
    });
  }

  set(game_id: string, data: ClientGameData) {
    return this.withStore('readwrite', store => store.put(data, game_id));
  }

  get(game_id: string) {
    let request: any;  // TODO: replace with local promise.
    return this.withStore('readonly', store => request = store.get(game_id))
        .then(() => request.result as ClientGameData);
  }

  list(handler: () => IDBRequest) {
    return this.withStore('readonly', store => {
      store.index('by_difficulty').openCursor().onsuccess = handler;
    })
  }

  delete_item(game_id: string) {
    return this.withStore('readwrite', store => store.delete(game_id));
  }
}
