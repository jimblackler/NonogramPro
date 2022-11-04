import {RequestHandler} from 'express';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getParam} from '../getParam';
import {datastore} from '../globalDatastore';

export const gamesHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.set('Cache-control', `public, max-age=${7 * 24 * 60 * 60}`);
  const collection = getParam(req.query, 'collection');
  if (!collection) {
    throw new Error();
  }

  const query = datastore.createQuery('Game')
      .hasAncestor(datastore.key(['Collection', collection]))
      .order('difficulty')
      .order('spec.width');

  res.send(JSON.stringify((await query.run()
      .then(result => result[0] as GameInDb[]))
      .map(game => gameToClientGame(game)), null, 2));
};
