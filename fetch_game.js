'use strict';

function get_game_internet(games_db, game_id, resolve, reject) {
  request(`/games?id=${game_id}`, 'GET', {}, evt => {
    const obj = JSON.parse(evt.target.response);
    if (obj.results.length == 1) {
      const game = obj.results[0].data;
      game.grid_data = decode(game.spec, game.grid_data);
      game.needs_publish = false;
      games_db.set(game_id, game);
      resolve(game);
    } else {
      reject();
    }
  });
}

function get_game(games_db, game_id, resolve, reject) {
  games_db.get(game_id).then(game => {
    if (game) {
      resolve(game);
      return;
    }
    get_game_internet(games_db, game_id, resolve, reject);
  });
}

