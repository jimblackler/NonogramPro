import {RequestHandler} from 'express';
import {GameInDb, gameToClientGame} from '../gameToClientGame';
import {getParam} from '../getParam';
import {datastore} from '../main';

export const gamesHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  const id = getParam(req.query, 'id');
  if (id) {
    const game = await datastore.get(datastore.key(['game', id]))
        .then(result => result[0] as GameInDb | undefined);
    res.send(JSON.stringify({results: game ? [gameToClientGame(game)] : []}, null, 2));
    return;
  }
  const results = await datastore.createQuery('game').run().then(result => result[0]);
  res.send(JSON.stringify({results: results.map(game => gameToClientGame(game))}, null, 2));
};
