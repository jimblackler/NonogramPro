import {datastore} from './globalDatastore';
import {nameToId} from './nameToId';

function randomId() {
  const out: string[] = [];
  for (let idx = 0; idx !== 4; idx++) {
    out.push(String.fromCharCode(97 + 26 * Math.random()));
  }
  return out.join('');
}

export async function getUniqueRawName(collection: string, input: string) {
  let nameStub = nameToId(input.toLowerCase());
  if (!nameStub) {
    nameStub = randomId();
  }
  let appendNumber = 0;
  while (true) {
    const rawName = appendNumber ? `${nameStub}_${appendNumber}` : nameStub;
    if (await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
        .then(result => result[0]) === undefined) {
      return rawName;
    }
    appendNumber++;
  }
}
