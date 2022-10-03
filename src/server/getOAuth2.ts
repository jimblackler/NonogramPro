import {Request} from 'express';
import {Credentials, OAuth2Client} from 'google-auth-library';
import jwt, {JwtPayload, VerifyErrors} from 'jsonwebtoken';
import clientSecret from './secret/clientSecret.json';
import secrets from './secret/secrets.json';

export function getOAuth2(req: Request) {
  return new Promise<OAuth2Client>((resolve, reject) => {
    const oAuth2 =
        new OAuth2Client(clientSecret.web.client_id, clientSecret.web.client_secret,
            clientSecret.web.redirect_uris.find(uri => uri.includes(`/${req.headers.host}/`)));
    if (req.cookies?.jwt) {
      jwt.verify(req.cookies.jwt, secrets.jwtSecret,
          (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
            if (err) {
              reject(err);
            } else {
              oAuth2.setCredentials(decoded as Credentials);
              resolve(oAuth2);
            }
          });
    } else {
      resolve(oAuth2);
    }
  });
}
