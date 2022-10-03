import {RequestHandler} from 'express';
import jwt from 'jsonwebtoken';
import {getOAuth2} from '../getOAuth2';
import secrets from '../secret/secrets.json';

export const authCallbackHandler: RequestHandler = async (req, res, next) => {
  const oAuth2 = await getOAuth2(req);
  const {code, state} = req.query;
  if (typeof code !== 'string' || typeof state !== 'string') {
    next();
    return;
  }
  const data = await oAuth2.getToken(code);
  res.cookie('jwt', jwt.sign(data.tokens, secrets.jwtSecret));
  res.redirect(state);
};
