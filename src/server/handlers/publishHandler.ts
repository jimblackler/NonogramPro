import {RequestHandler} from 'express';
import {isString} from '../../client/isString';
import {ClientGame, GameData} from '../../common/gameData';
import {getSignInUrl} from '../components/globalControls';
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

  const game = req.body as ClientGame;
  let gameId = game.key;

  const existingGame = await datastore.get(datastore.key(['game', gameId]))
      .then(result => result[0] as GameInDb | undefined);

  if (!existingGame || existingGame.creator !== email) {
    gameId = await getName(game.data.name);
  }

  const data: GameData = {
    name: game.data.name,
    spec: game.data.spec,
    style: game.data.style,
    creator: email,
    difficulty: 0,
    gridData: isString(game.data.gridData)
  };

  const key = datastore.key(['game', gameId]);
  await datastore.save({key, data});

  res.send(JSON.stringify({
    game: gameToClientGame((await datastore.get(key))[0])
  }, null, 2));
};
