import {readdir, readFile} from 'fs/promises';
import {JSDOM} from 'jsdom';
import path from 'path';
import {assertDefined} from '../common/check/defined';
import {encode} from '../common/encoder';
import {GameData} from '../common/gameData';
import {generateClues} from '../common/generateClues';
import {getImageData, imageDataToGridData} from '../common/importImage';
import {isComplete, Round, solve} from '../common/solve';
import {Spec} from '../common/spec';
import {getName} from '../server/getName';
import {datastore} from '../server/globalDatastore';

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

function gameExists(gridDataEncoded: string) {
  if (checked.has(gridDataEncoded)) {
    return Promise.resolve(true);
  }
  checked.add(gridDataEncoded);
  return datastore.createQuery('game').filter('gridData', gridDataEncoded).run()
      .then(result => result[0].length !== 0);
}

export async function main() {
  const window = new JSDOM().window;
  const document = window.document;
  global.DOMParser = window.DOMParser;
  const path = '/Users/jimblackler/code/material-design-icons/src';

  for await (const file of getFiles(path)) {
    if (!file.endsWith('.svg')) {
      continue;
    }

    readFile(file).then(result => getImageData('image/svg+xml', result.buffer, document))
        .then(imageData => {

          [5, 10, 20, 25, 30].forEach(size => {
            const spec: Spec = {width: size, height: size};
            const gridData = imageDataToGridData(imageData, spec);
            const clues = generateClues(spec, gridData);
            let difficulty = 0;
            let lastRound: Round | undefined;
            for (const round of solve(spec, clues)) {
              difficulty++;
              lastRound = round;
            }

            if (!isComplete(spec, assertDefined(lastRound))) {
              console.log('Cannot be completed with standard method.');
              return;
            }
            const parts = file.split('/');
            const stub = parts[parts.length - 3];
            const name = stub.split('_')
                .map(part => part.substring(0, 1).toUpperCase() + part.substring(1)).join(' ');
            console.log(`Requires ${difficulty} rounds to complete with standard method.`);
            const gridDataEncoded = encode(gridData);
            gameExists(gridDataEncoded).then(exists => {
              if (exists) {
                return;
              }

              const data: GameData = {
                name,
                spec,
                style: 'midnight',
                creator: 'auto',
                difficulty,
                gridData: gridDataEncoded,
                tags: []
              };

              getName(stub).then(name => {
                const key = datastore.key(['game', name]);
                datastore.save({key, data});
              });
            });
          });
        })
  }
}
