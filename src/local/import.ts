import {entity} from '@google-cloud/datastore/build/src/entity';
import {readdir, readFile} from 'fs/promises';
import {JSDOM} from 'jsdom';
import path from 'path';
import {isDefined} from '../common/check/defined';
import {encode} from '../common/encoder';
import {ClientGame, GameData} from '../common/gameData';
import {getImageData, imageDataToGridData} from '../common/importImage';
import {Spec} from '../common/spec';
import {calculateDifficulty} from '../server/calculateDifficulty';
import {GameInDb} from '../server/gameToClientGame';
import {getUniqueRawName} from '../server/getName';
import {datastore} from '../server/globalDatastore';
import tempReference from './tempReference.json';

async function* getFiles(directory: string): AsyncGenerator<string> {
  for (const dirent of await readdir(directory, {withFileTypes: true})) {
    const resolved = path.resolve(directory, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(resolved);
    } else {
      yield resolved;
    }
  }
}

const checked = new Set<string>();

interface ImageSet {
  path: string;
  license: string;
  namePathOffset?: number;
}

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

  const imageSets: { [key: string]: ImageSet } = {
    oct: {
      path: '/Users/jimblackler/code/octicons/icons',
      license: 'https://github.com/primer/octicons/blob/main/LICENSE'
    },
    ionic: {
      path: '/Users/jimblackler/code/ionicons/src/svg',
      license: 'https://github.com/ionic-team/ionicons/blob/main/LICENSE'
    },
    material: {
      path: '/Users/jimblackler/code/material-design-icons/src',
      license: 'https://github.com/google/material-design-icons#license',
      namePathOffset: 3
    },
    awesome: {
      path: '/Users/jimblackler/code/Font-Awesome/svgs',
      license: 'https://github.com/FortAwesome/Font-Awesome/blob/6.x/LICENSE.txt'
    },
    box: {
      path: '/Users/jimblackler/code/boxicons/svg',
      license: 'https://github.com/atisawd/boxicons/blob/master/LICENSE'
    }
  };

  const exists = (collection: string, rawName: string): boolean => {
    const fullName = `${collection}.${rawName}`;
    const had = usedNames.has(fullName);
    usedNames.add(fullName);
    return had;
  };

  let puzzles: { data: GameData; key: entity.Key }[] = [];
  const allPromises: Promise<any>[] = [];

  for (const [imageSetName, imageSet] of Object.entries(imageSets)) {
    if (imageSetName !== 'box') {
      continue;
    }
    for await (const file of getFiles(imageSet.path)) {
      if (!file.endsWith('.svg')) {
        continue;
      }

      await readFile(file).then(result => getImageData('image/svg+xml', result.buffer, document))
          .then(imageData => {
            [5, 10, 20, 25, 30].forEach(size => {
              const spec: Spec = {width: size, height: size};
              const gridData = imageDataToGridData(imageData, spec);
              const gridDataEncoded = encode(gridData);
              if (gridDatas.has(gridDataEncoded)) {
                console.log('exists');
                return;
              }
              gridDatas.add(gridDataEncoded);
              const difficulty = calculateDifficulty(spec, gridData);

              if (!difficulty) {
                console.log('Cannot be completed with standard method.');
                return;
              }
              const parts = file.split('/');
              const originalStub = parts[parts.length - (imageSet.namePathOffset ?? 1)];
              const dotPosition = originalStub.indexOf('.');
              const stub =
                  dotPosition === -1 ? originalStub : originalStub.substring(0, dotPosition);
              const name = stub.split('_')
                  .map(part => part.substring(0, 1).toUpperCase() + part.substring(1)).join(' ');
              console.log(
                  `${name} Requires ${difficulty} rounds to complete with standard method.`);


              const data: GameData = {
                name,
                license: imageSet.license,
                spec,
                difficulty,
                gridData: gridDataEncoded
              };

              const collection =
                  tempReference.some((game: ClientGame) =>
                      game.data.gridData === gridDataEncoded) ? 'main' : imageSetName;
              getUniqueRawName(collection, stub, exists)
                  .then(rawName => {
                    puzzles.push(
                        {key: datastore.key(['Collection', collection, 'Game', rawName]), data});
                    if (puzzles.length === 500) {
                      allPromises.push(datastore.save(puzzles));
                      puzzles = [];
                    }
                  });
            });
          })
    }
  }
  allPromises.push(datastore.save(puzzles));
  await Promise.all(allPromises);
}
