import {RequestHandler} from 'express';
import {getSignInUrl} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';

export const tagHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  if (!email) {
    res.send(JSON.stringify({'login': getSignInUrl(req, oAuth)}, null, 2));
    return;
  }

  const games = req.body.games;
  const tag = req.body.tag;

  res.send(JSON.stringify({}, null, 2));
};
