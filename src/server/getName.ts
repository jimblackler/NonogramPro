import {Datastore} from '@google-cloud/datastore';
import {nameToId} from './nameToId';

function randomId() {
  const out: string[] = [];
  for (let idx = 0; idx !== 4; idx++) {
    out.push(String.fromCharCode(97 + 26 * Math.random()));
  }
  return out.join('');
}

export async function getName(datastore: Datastore, input: string) {
  let gameId = '';
  let nameStub = nameToId(input.toLowerCase());
  if (!nameStub) {
    nameStub = randomId();
  }
  let appendNumber = 0;
  while (true) {
    if (appendNumber) {
      gameId = `${nameStub}_${appendNumber}`;
    } else {
      gameId = nameStub;
    }
    if (await datastore.get(datastore.key(['game', gameId]))
        .then(result => result.length) === 1) {
      break;
    }
    appendNumber++;
  }
  return gameId;
}
