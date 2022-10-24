import axios from 'axios';
import {GameData} from '../common/gameData';
import {gamesDb} from './db/gamesDb';
import {transactionToPromise} from './transactionToPromise';

export function getGameInternet(gameId: string): Promise<GameData> {
  return axios.get(`/games?id=${gameId}`)
      .then(value => value.data)
      .then(obj => {
        if (obj.results.length !== 1) {
          throw new Error();
        }
        const game = obj.results[0].data as GameData;
        game.needsPublish = false;
        gamesDb.then(db =>
            db.transaction('games', 'readwrite').objectStore('games').put(game, gameId));
        return game;
      });
}

export function getGame(gameId: string): Promise<GameData> {
  return gamesDb
      .then(db => db.transaction('games', 'readonly').objectStore('games').get(gameId))
      .then(transactionToPromise)
      .then(result => result as GameData)
      .then(game => game ? game : getGameInternet(gameId));
}
