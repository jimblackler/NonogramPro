import {RequestHandler} from 'express';
import {GameData} from '../../common/gameData';
import {getSignInUrl} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';

export const deleteHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  let gameId = req.body.gameId;

  const existingGame = await datastore.get(datastore.key(['game', gameId]))
      .then(result => result[0] as GameData | undefined);

  if (!existingGame || existingGame.creator !== email) {
    res.send(JSON.stringify({'exception': 'Not signed in'}, null, 2));
    return;
  }

  await datastore.delete(datastore.key(['game', gameId]));

  res.send(JSON.stringify({gameId}, null, 2));
};
