import {RequestHandler} from 'express';
import {decode} from '../../common/decoder';
import {ClientGame, GameData} from '../../common/gameData';
import {calculateDifficulty} from '../calculateDifficulty';
import {getSignInUrl} from '../components/globalControls';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getEmail} from '../getEmail';
import {getUniqueRawName} from '../getName';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import {parseGameId} from '../parseGameId';
import {userCanModify} from '../userCanModify';

export const publishHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  const game = req.body as ClientGame;

  let {collection, rawName} = parseGameId(game.key);

  if (!userCanModify(email, collection)) {
    throw new Error();
  }

  const existingGame =
      await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
          .then(result => result[0] as GameInDb | undefined);

  if (!existingGame || existingGame.creator !== email) {
    rawName = await getUniqueRawName(collection, game.data.name);
  }

  const spec = game.data.spec;
  const gridData = game.data.gridData;
  const data: GameData = {
    name: game.data.name,
    spec,
    style: game.data.style,
    creator: email,
    difficulty: game.data.difficulty === -1 ?
        calculateDifficulty(spec, decode(spec, gridData)) : game.data.difficulty,
    gridData
  };

  const key = datastore.key(['Collection', collection, 'Game', rawName]);
  await datastore.save({key, data});

  res.send(JSON.stringify({
    game: gameToClientGame((await datastore.get(key))[0])
  }, null, 2));
};
