import express, {Express} from 'express';
import {cookiesToObject} from './cookieUtils';
import {authCallbackHandler} from './handlers/authCallbackHandler';
import {deleteHandler} from './handlers/deleteHandler';
import {editHandler} from './handlers/editHandler';
import {gamesHandler} from './handlers/gamesHandler';
import {listHandler} from './handlers/listHandler';
import {playHandler} from './handlers/playHandler';
import {publishHandler} from './handlers/publishHandler';
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
app.route('/signOut').get(signOutHandler);
app.route('/').get(listHandler);

app.use(express.static('static'));
app.listen(8081);
