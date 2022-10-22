import {ClientGame, ClientGameData} from '../common/clientGame';
import {datastore} from './globalDatastore';

export type GameInDb = ClientGameData & { [datastore.KEY]: { name: string } };

export function gameToClientGame(game: GameInDb): ClientGame {
  return {
    key: game[datastore.KEY].name,
    data: {
      creator: game.creator,
      difficulty: game.difficulty,
      gridData: game.gridData,
      spec: game.spec,
      name: game.name,
      style: game.style
    }
  };
}
