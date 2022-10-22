import {RequestHandler} from 'express';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getParam} from '../getParam';
import {datastore} from '../globalDatastore';
import {Tag} from './tagHandler';

function intersection<T>(a: Set<T>, b: Set<T>) {
  return new Set<T>([...a].filter(element => b.has(element)));
}

export const gamesHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
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

  const limit = getParam(req.query, 'limit');
  if (limit) {
    query.limit(Number.parseInt(limit));
  }

  const results = await query.run().then(result => result[0] as GameInDb[]);

  const include = getParam(req.query, 'include');
  const include_ = new Set<string>();
  if (include) {
    include.split(',').forEach(tag => include_.add(tag));
  }

  const exclude = getParam(req.query, 'exclude');
  const exclude_ = new Set<string>();
  if (exclude) {
    exclude.split(',').forEach(tag => exclude_.add(tag));
  }

  const results_ = await Promise.all(results.map(game =>
      datastore.createQuery('tag').filter('game', game[datastore.KEY].name)
          .run().then(results => results[0] as Tag[])
          .then(tags => new Set<string>(tags.map(tag => tag.tag)))
          .then(tags => ({game, tags}))))
      .then(results => results.filter(result =>
          intersection(exclude_, result.tags).size === 0 &&
          intersection(include_, result.tags).size === include_.size))
      .then(results => results.map(result => gameToClientGame(result.game)));

  res.send(JSON.stringify(results_, null, 2));
};
