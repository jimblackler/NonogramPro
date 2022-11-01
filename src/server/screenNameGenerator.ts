import {datastore} from './globalDatastore';
import {nameToId} from './nameToId';
import {UserInfo} from './userInfo';

export async function getValidAndUniqueScreenName(requestedScreenName: string) {
  let screenName = nameToId(requestedScreenName);
  while (screenName.length < 4) {
    screenName += String.fromCharCode('0'.charCodeAt(0) + Math.floor(Math.random() * 10));
  }

  do {
    const existingNameUse = await datastore.createQuery('UserInfo')
        .filter('screenName', screenName).limit(1)
        .run()
        .then(result => result[0][0] as UserInfo | undefined);

    if (!existingNameUse) {
      break;
    }

    let lastNumberPosition = -1;
    for (let idx = 0; idx !== screenName.length; idx++) {
      const chr = screenName.charAt(idx);
      if (chr >= '0' && chr <= '9') {
        lastNumberPosition = idx;
      }
    }

    const withoutNumber = lastNumberPosition === -1 ? screenName : screenName.substring(0, lastNumberPosition);
    const number =
        lastNumberPosition === -1 ? 1 : Number.parseInt(screenName.substring(lastNumberPosition));

    screenName = `${withoutNumber}${number + 1}`;
  } while (true);
  return screenName;
}
