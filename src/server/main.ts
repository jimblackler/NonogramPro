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
import {staticHandler} from './handlers/staticHandler';
import {tagHandler} from './handlers/tagHandler';

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
app.route('/tag').post(tagHandler);
app.route('/').get(listHandler);
app.route('*').get(staticHandler);

app.listen(8081);
