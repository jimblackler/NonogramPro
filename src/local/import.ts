import {readdir, readFile} from 'fs/promises';
import {JSDOM} from 'jsdom';
import path from 'path';
import {Generate} from '../client/generate';
import {getImageData, imageDataToGridData} from '../common/importImage';
import {Spec} from '../common/spec';

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
  const path = '/Users/jimblackler/code/material-design-icons/src/communication';
  const spec: Spec = {width: 20, height: 20};
  const gridData = Generate.getEmpty(spec);
  for await (const file of getFiles(path)) {
    if (!file.endsWith('.svg')) {
      continue;
    }
    await readFile(file).then(result => getImageData('image/svg+xml', result.buffer, document))
        .then(imageData => imageDataToGridData(imageData, spec, gridData))
        .then(() => console.log(gridData));
  }
}
