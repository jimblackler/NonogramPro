import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {gamesDb} from './db/gamesDb';
import {playsDb} from './db/playsDb';
import {decode} from './decoder';
import {notNull} from './notNull';
import {requestToAsyncGenerator} from './requestToAsyncGenerator';

function addGame(key: string, game: ClientGameData, playing: boolean, list: HTMLElement) {
  const li = document.createElement('li');
  const anchor = document.createElement('a');
  anchor.setAttribute('href', `/play?game=${key}`);
  li.appendChild(anchor);

  /* Name */
  {
    const name = document.createElement('span');
    name.classList.add('name');
    name.appendChild(document.createTextNode(game.name));
    anchor.appendChild(name);
  }

  if (game.creator) {
    const creator = document.createElement('span');
    creator.classList.add('creator');
    creator.appendChild(document.createTextNode(`by ${game.creator}`));
    anchor.appendChild(creator);
  }

  if (game.difficulty) {
    const name = document.createElement('span');
    name.classList.add('difficulty');
    const text = document.createTextNode(`Difficulty ${game.difficulty}`);
    name.appendChild(text);
    anchor.appendChild(name);
  }

  if (game.needsPublish) {
    const name = document.createElement('span');
    name.classList.add('draft');
    name.appendChild(document.createTextNode('Draft'));
    anchor.appendChild(name);
  }

  /* Dimensions */
  {
    const dimensions = document.createElement('span');
    dimensions.classList.add('dimensions');
    const text =
        document.createTextNode(`${game.spec.width} x ${game.spec.height}`);
    dimensions.appendChild(text);
    anchor.appendChild(dimensions);
  }

  if (playing) {
    const playing = document.createElement('span');
    playing.classList.add('playing');
    playing.appendChild(document.createTextNode('In progress'));
    anchor.appendChild(playing);
  }

  list.appendChild(li);
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

  if ((new URL(window.location.href).searchParams.get('v') || 'local') === 'local') {
    for await (const result of await gamesDb
        .then(db => db.transaction('games', 'readonly')
            .objectStore('games').index('byDifficulty').openCursor())
        .then(requestToAsyncGenerator)) {
      const primaryKey = result.primaryKey.toString();
      addGame(primaryKey, result.value, plays.has(primaryKey), list);
    }
    progress.remove();
  } else {
    axios.get('/games')
        .then(response => response.data)
        .then(obj => {
          for (let game of obj.results) {
            addGame(game.key, game.data, plays.has(game.key), list);
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
