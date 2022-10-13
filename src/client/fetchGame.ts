import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {GamesDb} from './db/gamesDb';
import {decode} from './decoder';

function getGameInternet(gamesDb: GamesDb, gameId: string,
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
          gamesDb.set(gameId, game).then(() => resolve(game));
        } else {
          reject();
        }
      });
}

export function getGame(gamesDb: GamesDb, gameId: string,
                        resolve: (game: ClientGameData) => void, reject: () => void) {
  gamesDb.get(gameId).then(game => {
    if (game) {
      resolve(game);
      return;
    }
    getGameInternet(gamesDb, gameId, resolve, reject);
  });
}
