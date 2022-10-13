import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {getGameDb, setGame} from './db/gamesDb';
import {decode} from './decoder';

function getGameInternet(gameId: string,
                         resolve: (game: ClientGameData) => void, reject: () => void) {
  axios.get(`/games?id=${gameId}`)
      .then(value => value.data)
      .then(obj => {
        if (obj.results.length === 1) {
          const game = obj.results[0].data as ClientGameData;
          if (typeof game.gridData !== 'string') {
            throw new Error();
          }
          game.gridData = decode(game.spec, game.gridData);
          game.needsPublish = false;
          setGame(gameId, game).then(() => resolve(game));
        } else {
          reject();
        }
      });
}

export function getGame(gameId: string,
                        resolve: (game: ClientGameData) => void, reject: () => void) {
  getGameDb(gameId).then(game => {
    if (game) {
      resolve(game);
      return;
    }
    getGameInternet(gameId, resolve, reject);
  });
}
