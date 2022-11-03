import {nameToId} from './nameToId';

function randomId() {
  const out: string[] = [];
  for (let idx = 0; idx !== 4; idx++) {
    out.push(String.fromCharCode(97 + 26 * Math.random()));
  }
  return out.join('');
}


export async function getUniqueRawName(
    collection: string, input: string,
    exists: (collection: string, rawName: string) => Promise<boolean> | boolean) {

  let nameStub = nameToId(input);
  if (!nameStub) {
    nameStub = randomId();
  }
  let appendNumber = 0;
  while (true) {
    const rawName = appendNumber ? `${nameStub}_${appendNumber}` : nameStub;
    if (!await exists(collection, rawName)) {
      return rawName;
    }
    appendNumber++;
  }
}
