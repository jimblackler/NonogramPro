import {RequestHandler} from 'express';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getParam} from '../getParam';
import {datastore} from '../globalDatastore';

export const gamesHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.set('Cache-control', `public, max-age=${7 * 24 * 60 * 60}`);
  const id = getParam(req.query, 'id');
  if (id) {
    const game = await datastore.get(datastore.key(['game', id]))
        .then(result => result[0] as GameInDb | undefined);
    res.send(JSON.stringify({results: game ? [gameToClientGame(game)] : []}, null, 2));
    return;
  }
  const query = datastore.createQuery('game');
  const creator = getParam(req.query, 'creator');
  if (creator) {
    query.filter('creator', creator);
  }

  query.order('difficulty');

  const limit = getParam(req.query, 'limit');
  if (limit) {
    query.limit(Number.parseInt(limit));
  }

  const include = getParam(req.query, 'include');
  if (include) {
    include.split(',').forEach(tag => query.filter('tags', tag));
  }

  const exclude = new Set<string>((getParam(req.query, 'exclude') || '').split(','));

  const results = await query.run()
      .then(result => result[0] as GameInDb[])
      .then(results => results.filter(gameInDb => !gameInDb.tags.some(tag => exclude.has(tag))));

  res.send(JSON.stringify(results.map(result => gameToClientGame(result)), null, 2));
};
