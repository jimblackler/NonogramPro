import {RequestHandler} from 'express';
import {GameData} from '../../common/gameData';
import {getSignInUrl} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import {parseGameId} from '../../common/parseGameId';
import secrets from '../secret/secrets.json';
import {userCanModify} from '../userCanModify';

export const deleteHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  let {collection, rawName} = parseGameId(req.body.gameId);

  if (!userCanModify(email, collection)) {
    throw new Error();
  }
  const existingGame =
      await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
          .then(result => result[0] as GameData | undefined);

  if (!existingGame || (email !== secrets.administrator && existingGame.creator !== email)) {
    res.send(JSON.stringify({'exception': 'Not signed in'}, null, 2));
    return;
  }

  await datastore.delete(datastore.key(['Collection', collection, 'Game', rawName]));

  res.send(JSON.stringify({gameId: `${collection}.${rawName}`}, null, 2));
};
