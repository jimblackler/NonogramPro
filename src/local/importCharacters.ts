import {JSDOM} from 'jsdom';
import {isDefined} from '../common/check/defined';
import {assertNotNull} from '../common/check/null';
import {encode} from '../common/encoder';
import {ClientGame, GameData} from '../common/gameData';
import {imageDataToGridData} from '../common/importImage';
import {Spec} from '../common/spec';
import {calculateDifficulty} from '../server/calculateDifficulty';
import {GameInDb} from '../server/gameToClientGame';
import {getUniqueRawName} from '../server/getName';
import {datastore} from '../server/globalDatastore';
import {shard} from './shard';
import tempReference from './tempReference.json';

export async function main() {
  const window = new JSDOM().window;
  const document = window.document;
  global.DOMParser = window.DOMParser;

  const gridDatas = new Set<string>(
      [...(await datastore.createQuery('Game').select('gridData').run()
          .then(result => result[0] as Partial<GameInDb>[])
          .then(games => games.map(game => game.gridData).filter(isDefined)))]);

  const usedNames = new Set<string>(
      [...(await datastore.createQuery('Game').select('__key__').run()
          .then(result => result[0] as Partial<GameInDb>[])
          .then(games => games.map(game => {
            const key = game[datastore.KEY];
            return `${key?.parent?.name}.${key?.name}`;
          }).filter(isDefined)))]);

  const exists = (collection: string, rawName: string): boolean => {
    const fullName = `${collection}.${rawName}`;
    const had = usedNames.has(fullName);
    usedNames.add(fullName);
    return had;
  };

  for (let chr = 0x0021; chr !== 0x0200; chr++) {
    const canvas = document.createElement('canvas');
    const ctx = assertNotNull(canvas.getContext('2d'));
    canvas.width = 1000;
    canvas.height = 1000;

    ctx.font = 'normal 700px initial';
    ctx.fillText(String.fromCharCode(chr), 0, 600);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    await Promise.all([5, 10, 15, 20, 25, 30].map(size => {
      const spec: Spec = {width: size, height: size};
      const gridData = imageDataToGridData(imageData, spec);
      const gridDataEncoded = encode(gridData);
      if (gridDatas.has(gridDataEncoded)) {
        console.log('exists');
        return Promise.resolve(undefined);
      }
      gridDatas.add(gridDataEncoded);
      const difficulty = calculateDifficulty(spec, gridData);
      if (!difficulty) {
        console.log(`Can't solve`);
        return Promise.resolve(undefined);
      }

      const collection = tempReference.some((game: ClientGame) =>
          game.data.gridData === gridDataEncoded) ? 'main' : 'dings';

      const stub = chr.toString();
      const name = `Dings ${chr}`;
      return getUniqueRawName(collection, stub, exists)
          .then(rawName => {
            const data: GameData = {
              name,
              spec,
              difficulty,
              gridData: gridDataEncoded
            };
            return {key: datastore.key(['Collection', collection, 'Game', rawName]), data};
          });
    })).then(results => results.filter(isDefined))
        .then(results => shard(results, 500).map(puzzles => datastore.save(puzzles)))
        .then(promises => Promise.all(promises));

  }
}
