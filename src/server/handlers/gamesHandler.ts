import {RequestHandler} from 'express';
import {gameToClientGame} from '../gameToClientGame';
import {getGame} from '../getGame';
import {getParam} from '../getParam';
import {datastore} from '../main';

export const gamesHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  const id = getParam(req.query, 'id');
  if (id) {
    const game = await getGame(id);
    res.send(JSON.stringify({results: game ? [gameToClientGame(game)] : []}, null, 2));
    return;
  }
  res.send(JSON.stringify({
    results:
        (await datastore.createQuery('game').run()
            .then(result => result[0])).map(game => gameToClientGame(game))
  }, null, 2));
};
