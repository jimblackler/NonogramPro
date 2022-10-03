import {RequestHandler} from 'express';
import {getOAuth2} from '../getOAuth2';

export const signOutHandler: RequestHandler = async (req, res, next) => {
  res.clearCookie('jwt');
  const oAuth2 = await getOAuth2(req);
  try {
    await oAuth2.revokeCredentials();
  } catch (err) {
    next(err);
  }
  const _return = req.query.return;
  if (typeof _return !== 'string') {
    next();
    return;
  }
  res.clearCookie('identity');
  res.redirect(_return);
};
