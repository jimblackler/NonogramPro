import {datastore} from './main';

export function gameToClientGame(game: any) {
  return {
    key: game[datastore.KEY].name,
    data: {
      creator: game.creator,
      difficulty: game.difficulty,
      grid_data: game.grid_data,
      spec: {
        width: game.width, height: game.height
      },
      name: game.name,
      style: game.style
    }
  };
}
