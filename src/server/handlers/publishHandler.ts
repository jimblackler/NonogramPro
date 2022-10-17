import {RequestHandler} from 'express';
import {getSignInUrl} from '../components/globalControls';
import {Game} from '../game';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getEmail} from '../getEmail';
import {getName} from '../getName';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';

export const publishHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  let gameId = req.body.gameId;

  const existingGame = await datastore.get(datastore.key(['game', gameId]))
      .then(result => result[0] as GameInDb | undefined);

  if (!existingGame || existingGame.creator !== email) {
    gameId = await getName(req.body.name);
  }

  const game: Game = {
    name: req.body.name,
    width: req.body.spec.width,
    height: req.body.spec.height,
    style: req.body.style,
    creator: email,
    difficulty: 0,
    gridData: req.body.gridData
  };

  const key = datastore.key(['game', gameId]);
  await datastore.save({
    key: key,
    data: game
  });

  res.send(JSON.stringify({
    game: gameToClientGame((await datastore.get(key))[0])
  }, null, 2));
};
