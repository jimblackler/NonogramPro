import axios from 'axios';
import {ClientGame, GameData} from '../common/gameData';
import {gamesDb} from './db/gamesDb';
import {transactionToPromise} from './transactionToPromise';

export function getGameInternet(gameId: string): Promise<GameData> {
  // First we look in the main collection of games because this is virtually certain to be cached.
  return axios.get(`/games?include=main`)
      .then(response => response.data as ClientGame[])
      .then(games => games.find(game => game.key === gameId))
      .then(game => game ? game.data : axios.get(`/games?id=${gameId}`)
          .then(response => response.data as ClientGame[])
          .then(games => {
            if (games.length !== 1) {
              throw new Error();
            }
            return games[0].data;
          }));
}

export function getGame(gameId: string): Promise<GameData> {
  return gamesDb
      .then(db => db.transaction('games', 'readonly').objectStore('games').get(gameId))
      .then(transactionToPromise)
      .then(result => result as GameData)
      .then(game => game ? game : getGameInternet(gameId));
}
