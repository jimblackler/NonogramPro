import {RequestHandler} from 'express';
import {shard} from '../../local/shard';
import {getSignInUrl} from '../components/globalControls';
import {GameInDb} from '../gameToClientGame';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';
import secrets from '../secret/secrets.json';

function isDefined<T>(object: T | undefined): object is T {
  return object !== undefined;
}

export const tagHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }
  if (email !== secrets.administrator) {
    // Only the administrator can do this kind of tagging.
    res.send(JSON.stringify({}, null, 2));
    return;
  }

  const games = req.body.games as string[];
  const tag = req.body.tag as string;

  await Promise.all(games.map(gameId => datastore.get(datastore.key(['game', gameId]))
      .then(result => result[0] as GameInDb | undefined))).then(results =>
      results.filter(isDefined)
          .filter(game => game.tags.indexOf(tag) === -1)
          .map(game => {
            if (tag.startsWith('-')) {
              game.tags = game.tags.filter(tag_ => tag_ !== tag.substring(1));
            } else {
              game.tags.push(tag);
            }
            return game;
          })).then(results => shard(results, 500).map(shard => datastore.save(shard)));

  res.send(JSON.stringify({}, null, 2));
};
