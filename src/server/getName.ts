import {datastore} from './globalDatastore';
import {nameToId} from './nameToId';

function randomId() {
  const out: string[] = [];
  for (let idx = 0; idx !== 4; idx++) {
    out.push(String.fromCharCode(97 + 26 * Math.random()));
  }
  return out.join('');
}

// This is a bit hacky. Mainly for the importer which was double allocating through race conditions.
const checkedName = new Set<string>();

export async function getUniqueRawName(collection: string, input: string) {
  let nameStub = nameToId(input);
  if (!nameStub) {
    nameStub = randomId();
  }
  let appendNumber = 0;
  while (true) {
    const rawName = appendNumber ? `${nameStub}_${appendNumber}` : nameStub;
    const fullName = `${collection}.${rawName}`;
    if (!checkedName.has(fullName)) {
      checkedName.add(fullName);
      if (await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
          .then(result => result[0]) === undefined) {
        return rawName;
      }
    }
    appendNumber++;
  }
}
