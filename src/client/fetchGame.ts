import axios from 'axios';
import {ClientGame, GameData} from '../common/gameData';
import {parseGameId} from '../server/parseGameId';
import {gamesDb} from './db/gamesDb';
import {transactionToPromise} from './transactionToPromise';

export function getGameInternet(gameId: string): Promise<GameData> {
  const {collection, rawName} = parseGameId(gameId);
  return axios.get(`/games?collection=${collection}`)
      .then(response => response.data as ClientGame[])
      .then(games => {
        const game = games.find(game => game.key === `${collection}.${rawName}`);
        if (game === undefined) {
          throw new Error();
        }
        return game.data;
      });
}

export function getGame(gameId: string): Promise<GameData> {
  return gamesDb
      .then(db => db.transaction('games', 'readonly').objectStore('games').get(gameId))
      .then(transactionToPromise)
      .then(result => result as GameData)
      .then(game => game ? game : getGameInternet(gameId));
}
