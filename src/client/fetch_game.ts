import {ClientGameData} from '../common/clientGame';
import {GamesDb} from './db/games_db';
import {decode} from './decoder';
import {request} from './request';

function get_game_internet(games_db: GamesDb, game_id: string,
                           resolve: (game: ClientGameData) => void, reject: () => void) {
  request(`/games?id=${game_id}`, 'GET', {}, evt => {
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
      games_db.set(game_id, game).then(() => resolve(game));
    } else {
      reject();
    }
  });
}

export function get_game(games_db: GamesDb, game_id: string,
                         resolve: (game: ClientGameData) => void, reject: () => void) {
  games_db.get(game_id).then(game => {
    if (game) {
      resolve(game);
      return;
    }
    get_game_internet(games_db, game_id, resolve, reject);
  });
}
