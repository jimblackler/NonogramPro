import {RequestHandler} from 'express';
import {DeleteResponse} from '../../common/deleteResponse';
import {GameData} from '../../common/gameData';
import {parseGameId} from '../../common/parseGameId';
import {getSignInUrl} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import secrets from '../secret/secrets.json';
import {userCanModify} from '../userCanModify';
import {UserInfo} from '../userInfo';

export const deleteHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    const deleteResponse: DeleteResponse = {'login': getSignInUrl(req, oAuth)};
    res.send(JSON.stringify(deleteResponse, null, 2));
    return;
  }

  const userInfo = await datastore.get(datastore.key(['UserInfo', email]))
      .then(result => result[0] as UserInfo | undefined);

  if (!userInfo) {
    const deleteResponse: DeleteResponse = {error: 'Could not find user info'};
    res.send(JSON.stringify(deleteResponse, null, 2));
    return;
  }

  let {collection, rawName} = parseGameId(req.body.gameId);

  if (!userCanModify(email, collection, userInfo)) {
    const deleteResponse: DeleteResponse = {error: 'Not allowed to delete'};
    res.send(JSON.stringify(deleteResponse, null, 2));
    return;
  }
  const existingGame =
      await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
          .then(result => result[0] as GameData | undefined);

  if (!existingGame || (email !== secrets.administrator && existingGame.creatorEmail !== email)) {
    res.send(JSON.stringify({'exception': 'Not signed in'}, null, 2));
    return;
  }

  await datastore.delete(datastore.key(['Collection', collection, 'Game', rawName]));

  const deleteResponse: DeleteResponse = {gameId: `${collection}.${rawName}`};
  res.send(JSON.stringify(deleteResponse, null, 2));
};
