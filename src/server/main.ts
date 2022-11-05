import express, {Express} from 'express';
import parseurl from 'parseurl';
import send from 'send';
import {assertTruthy} from '../common/check/truthy';
import {cookiesToObject} from './cookieUtils';
import {authCallbackHandler} from './handlers/authCallbackHandler';
import {deleteHandler} from './handlers/deleteHandler';
import {editHandler} from './handlers/editHandler';
import {gamesHandler} from './handlers/gamesHandler';
import {listHandler} from './handlers/listHandler';
import {playHandler} from './handlers/playHandler';
import {publishHandler} from './handlers/publishHandler';
import {puzzleSizeImageHandler} from './handlers/puzzleSizeImageHandler';
import {setScreenNameHandler} from './handlers/setScreenNameHandler';
import {signOutHandler} from './handlers/signOutHandler';

const app: Express = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use((req, res, next) => {
  const cookies = req.headers.cookie;
  if (cookies) {
    req.cookies = cookiesToObject(cookies);
  }
  next();
});

app.route('/authCallback').get(authCallbackHandler);
app.route('/delete').post(deleteHandler);
app.route('/edit').get(editHandler);
app.route('/games').get(gamesHandler);
app.route('/play').get(playHandler);
app.route('/publish').post(publishHandler);
app.route('/setScreenName').post(setScreenNameHandler);
app.route('/signOut').get(signOutHandler);
app.route('/test.png').get(puzzleSizeImageHandler);
app.route('/').get(listHandler);
app.route('/dist/*').get((req, res) => {
  res.set('Cache-control', `public, max-age=${365 * 24 * 60 * 60}`);
  send(req, assertTruthy(parseurl(req)?.pathname), {root: 'static'}).pipe(res);
});
app.route('*').get((req, res) =>
    send(req, assertTruthy(parseurl(req)?.pathname), {root: 'static'}).pipe(res));

app.listen(8081);
