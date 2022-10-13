import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {gamesDb} from './db/gamesDb';
import {decode} from './decoder';
import {transactionToPromise} from './transactionToPromise';

function getGameInternet(gameId: string): Promise<ClientGameData> {
  return axios.get(`/games?id=${gameId}`)
      .then(value => value.data)
      .then(obj => {
        if (obj.results.length !== 1) {
          throw new Error();
        }
        const game = obj.results[0].data as ClientGameData;
        if (typeof game.gridData !== 'string') {
          throw new Error();
        }
        game.gridData = decode(game.spec, game.gridData);
        game.needsPublish = false;
        gamesDb.then(db =>
            db.transaction('games', 'readwrite').objectStore('games').put(game, gameId));
        return game;
      });
}

export function getGame(gameId: string): Promise<ClientGameData> {
  return gamesDb
      .then(db => db.transaction('games', 'readonly').objectStore('games').get(gameId))
      .then(transactionToPromise)
      .then(result => result as ClientGameData)
      .then(game => game ? game : getGameInternet(gameId));
}
