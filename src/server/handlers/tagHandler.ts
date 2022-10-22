import {RequestHandler} from 'express';
import {shard} from '../../local/shard';
import {getSignInUrl} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {datastore} from '../globalDatastore';

export const tagHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  const games = req.body.games as string[];
  const tag = req.body.tag;

  await Promise.all(shard(games.map(game => ({
    key: datastore.key('tag'),
    data: {game, tag, user: email}
  })), 500).map(entities => datastore.save(entities)));

  res.send(JSON.stringify({}, null, 2));
};
