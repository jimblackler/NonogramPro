import {readdir, readFile} from 'fs/promises';
import {JSDOM} from 'jsdom';
import path from 'path';
import {encode} from '../common/encoder';
import {generateClues} from '../common/generateClues';
import {getImageData, imageDataToGridData} from '../common/importImage';
import {isComplete, Round, solve} from '../common/solve';
import {Spec} from '../common/spec';
import {truthy} from '../common/truthy';
import {Game} from '../server/game';
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

export async function main() {
  const window = new JSDOM().window;
  const document = window.document;
  global.DOMParser = window.DOMParser;
  const path = '/Users/jimblackler/code/material-design-icons/src/social';
  const spec: Spec = {width: 20, height: 20};
  for await (const file of getFiles(path)) {
    if (!file.endsWith('.svg')) {
      continue;
    }
    await readFile(file).then(result => getImageData('image/svg+xml', result.buffer, document))
        .then(imageData => imageDataToGridData(imageData, spec))
        .then(async gridData => {
          const clues = generateClues(spec, gridData);
          let difficulty = 0;
          let lastRound: Round | undefined;
          for (const round of solve(spec, clues)) {
            difficulty++;
            lastRound = round;
          }

          if (isComplete(spec, truthy(lastRound))) {
            const parts = file.split('/');
            const stub = parts[parts.length - 3];
            const name = stub.split('_')
                .map(part => part.substring(0, 1).toUpperCase() + part.substring(1)).join(' ');
            console.log(`Requires ${difficulty} rounds to complete with standard method.`);
            const gridDataEncoded = encode(gridData);
            const existing =
                await datastore.createQuery('game').filter('gridData', gridDataEncoded).run();
            if (existing[0].length) {
              return;
            }

            const game: Game = {
              name,
              width: spec.width,
              height: spec.height,
              style: 'midnight',
              creator: 'auto',
              difficulty,
              gridData: gridDataEncoded
            };

            const key = datastore.key(['game', await getName(stub)]);
            await datastore.save({
              key: key,
              data: game
            });
          } else {
            console.log('Cannot be completed with standard method.');
          }
        });
  }
}
