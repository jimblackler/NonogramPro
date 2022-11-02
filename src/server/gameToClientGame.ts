import {entity} from '@google-cloud/datastore/build/src/entity';
import {assertDefined} from '../common/check/defined';
import {ClientGame, GameData} from '../common/gameData';
import {datastore} from './globalDatastore';

export type GameInDb = GameData & { [datastore.KEY]: entity.Key };

export function gameToClientGame(game: GameInDb): ClientGame {
  const key = assertDefined(game[datastore.KEY]);
  return {
    key: `${assertDefined(key.parent).name}.${key.name}`,
    data: {
      // Does not send creator email.
      creatorScreenName: game.creatorScreenName,
      difficulty: game.difficulty,
      gridData: game.gridData,
      spec: game.spec,
      name: game.name,
      style: game.style,
      license: game.license
    }
  };
}
