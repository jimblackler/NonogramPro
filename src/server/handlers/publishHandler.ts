import {RequestHandler} from 'express';
import {decode} from '../../common/decoder';
import {ClientGame, GameData} from '../../common/gameData';
import {parseGameId} from '../../common/parseGameId';
import {PublishResponse} from '../../common/publishResponse';
import {calculateDifficulty} from '../calculateDifficulty';
import {getSignInUrl} from '../components/globalControls';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getEmail} from '../getEmail';
import {getUniqueRawName} from '../getName';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import {userCanModify} from '../userCanModify';
import {UserInfo} from '../userInfo';

function exists(collection: string, rawName: string): Promise<boolean> {
  return datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
      .then(result => result[0] === undefined);
}

export const publishHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    const publishResponse: PublishResponse = {'login': getSignInUrl(req, oAuth)};
    res.send(JSON.stringify(publishResponse, null, 2));
    return;
  }

  const userInfo = await datastore.get(datastore.key(['UserInfo', email]))
      .then(result => result[0] as UserInfo | undefined);

  if (!userInfo) {
    const publishResponse: PublishResponse = {
      error: 'Could not find user information'
    };
    res.send(JSON.stringify(publishResponse, null, 2));
    return;
  }

  const game = req.body as ClientGame;

  let {collection, rawName} = parseGameId(game.key);

  if (collection === 'local') {
    collection = userInfo.screenName;
  }

  const existingGame_ =
      await datastore.get(datastore.key(['Collection', collection, 'Game', rawName]))
          .then(result => result[0] as GameInDb | undefined);

  if (!existingGame_) {
    rawName = await getUniqueRawName(collection, game.data.name, exists);
  }

  if (!userCanModify(email, collection, userInfo)) {
    const publishResponse: PublishResponse = {
      error: `${userInfo.screenName} has no permission to publish to collection ${collection}`
    };
    res.send(JSON.stringify(publishResponse, null, 2));
    return;
  }

  const spec = game.data.spec;
  const gridData = game.data.gridData;
  const data: GameData = {
    name: game.data.name,
    spec,
    style: game.data.style,
    creatorEmail: email,
    creatorScreenName: userInfo.screenName,
    difficulty: game.data.difficulty === -1 ?
        calculateDifficulty(spec, [...decode(spec, gridData)]) : game.data.difficulty,
    gridData
  };

  const key = datastore.key(['Collection', collection, 'Game', rawName]);
  await datastore.save({key, data});

  const publishResponse: PublishResponse = {
    game: gameToClientGame((await datastore.get(key))[0])
  };
  res.send(JSON.stringify(publishResponse, null, 2));
};
