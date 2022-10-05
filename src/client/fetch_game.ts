import {ClientGameData} from '../common/clientGame';
import {GamesDb} from './db/games_db';
import {decode} from './decoder';
import {request} from './request';

function getGameInternet(gamesDb: GamesDb, gameId: string,
                         resolve: (game: ClientGameData) => void, reject: () => void) {
  request(`/games?id=${gameId}`, 'GET', {}, evt => {
    const target = evt.target;
    if (!(target instanceof XMLHttpRequest)) {
      throw new Error();
    }
    const obj = JSON.parse(target.response);
    if (obj.results.length === 1) {
      const game = obj.results[0].data as ClientGameData;
      if (typeof game.grid_data !== 'string') {
        throw new Error();
      }
      game.grid_data = decode(game.spec, game.grid_data);
      game.needs_publish = false;
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
