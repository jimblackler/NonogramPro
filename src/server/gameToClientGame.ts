import {ClientGame} from '../common/clientGame';
import {Game} from './game';
import {datastore} from './main';

export type GameInDb = Game & { [datastore.KEY]: { name: string } };

export function gameToClientGame(game: GameInDb): ClientGame {
  return {
    key: game[datastore.KEY].name,
    data: {
      creator: game.creator,
      difficulty: game.difficulty,
      gridData: game.gridData,
      spec: {
        width: game.width, height: game.height
      },
      name: game.name,
      style: game.style
    }
  };
}
