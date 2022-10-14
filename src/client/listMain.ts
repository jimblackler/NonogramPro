import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {completedDb} from './db/completedDb';
import {gamesDb} from './db/gamesDb';
import {playsDb} from './db/playsDb';
import {decode} from './decoder';
import {notNull} from './notNull';
import {requestToAsyncGenerator} from './requestToAsyncGenerator';

function addGame(
    key: string, game: ClientGameData, playing: boolean, completed: boolean, list: HTMLElement) {
  const li = document.createElement('li');
  list.append(li);

  const anchor = document.createElement('a');
  li.append(anchor);
  anchor.setAttribute('href', `/play?game=${key}`);
  anchor.setAttribute('class', completed ? 'completed' : playing ? 'playing' : 'unstarted');

  /* Name */
  {
    const name = document.createElement('span');
    anchor.append(name);
    name.setAttribute('class', 'name');
    name.append(game.name);
  }

  if (game.creator) {
    const creator = document.createElement('span');
    anchor.append(creator);
    creator.setAttribute('class', 'creator');
    creator.append(`by ${game.creator}`);
  }

  if (game.difficulty) {
    const name = document.createElement('span');
    anchor.append(name);
    name.setAttribute('class', 'difficulty');
    name.append(`Difficulty ${game.difficulty}`);
  }

  if (game.needsPublish) {
    const name = document.createElement('span');
    anchor.append(name);
    name.append('Draft');
  }

  /* Dimensions */
  {
    const dimensions = document.createElement('span');
    anchor.append(dimensions);
    dimensions.setAttribute('class', 'dimensions');
    dimensions.append(`${game.spec.width} x ${game.spec.height}`);
  }

  if (completed || playing) {
    const span = document.createElement('span');
    anchor.append(span);
    span.setAttribute('class', 'status');
    span.append(completed ? 'Completed' : 'In progress');
  }
}

async function populate() {
  const list = notNull(document.getElementById('games'));
  const progress = document.createElement('img');
  list.append(progress);
  progress.setAttribute('src', '/images/progress.svg');

  const plays = new Set<string>();
  for await (const currentTarget of await playsDb
      .then(db => db.transaction('plays', 'readonly').objectStore('plays').openCursor())
      .then(requestToAsyncGenerator)) {
    plays.add(currentTarget.key.toString());
  }

  const completed = new Set<string>();
  for await (const currentTarget of await completedDb
      .then(db => db.transaction('completed', 'readonly').objectStore('completed').openCursor())
      .then(requestToAsyncGenerator)) {
    completed.add(currentTarget.key.toString());
  }

  if ((new URL(window.location.href).searchParams.get('v') || 'local') === 'local') {
    for await (const result of await gamesDb
        .then(db => db.transaction('games', 'readonly')
            .objectStore('games').index('byDifficulty').openCursor())
        .then(requestToAsyncGenerator)) {
      const key = result.primaryKey.toString();
      addGame(key, result.value, plays.has(key), completed.has(key), list);
    }
    progress.remove();
  } else {
    axios.get('/games')
        .then(response => response.data)
        .then(obj => {
          for (let game of obj.results) {
            addGame(game.key, game.data, plays.has(game.key), completed.has(game.key), list);
            // We write the incoming games to the local database (which needs
            // the grid decoding). Might not always be desirable.
            game.data.gridData = decode(game.data.spec, game.data.gridData);
            gamesDb.then(db => db.transaction('games', 'readwrite').objectStore('games')
                .put(game.data, game.key));
          }
        })
        .finally(() => progress.remove());
  }
}

populate().then();
