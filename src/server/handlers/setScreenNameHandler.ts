import {RequestHandler} from 'express';
import {assertString} from '../../common/check/string';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import {getValidAndUniqueScreenName} from '../screenNameGenerator';
import {UserInfo} from '../userInfo';

export const setScreenNameHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    throw new Error();
  }

  const existingUserInfo = await datastore.get(datastore.key(['UserInfo', email]))
      .then(result => result[0] as UserInfo | undefined);

  if (existingUserInfo) {
    // Users are only allowed to set UserInfo once.
    throw new Error();
  }

  const requestedScreenName = assertString(req.body.requestedScreenName || '');

  const screenName = await getValidAndUniqueScreenName(requestedScreenName);

  if (screenName === requestedScreenName) {
    const data: UserInfo = {screenName};
    const key = datastore.key(['UserInfo', email]);
    await datastore.save({key, data});

    res.send(JSON.stringify(''));
  } else {
    res.send(JSON.stringify(screenName));
  }
};
