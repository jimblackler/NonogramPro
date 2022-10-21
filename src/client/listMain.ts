import axios from 'axios';
import {ClientGame, ClientGameData} from '../common/clientGame';
import {completedDb} from './db/completedDb';
import {gamesDb} from './db/gamesDb';
import {playsDb} from './db/playsDb';
import {decode} from './decoder';
import {is} from './is';
import {notNull} from './notNull';
import {requestToAsyncGenerator} from './requestToAsyncGenerator';

function createThumbnail(parent: HTMLElement, game: ClientGameData) {
  const canvas = document.createElement('canvas');
  parent.append(canvas);
  const ctx = notNull(canvas.getContext('2d'));
  if (typeof game.gridData === 'string') {
    throw new Error();
  }
  const cellSize = Math.ceil(60 / game.spec.width);
  canvas.width = game.spec.width * cellSize;
  canvas.height = game.spec.height * cellSize;
  ctx.fillStyle = 'lightblue';
  game.gridData.forEach((row, rowNumber) => row.forEach((cell, columnNumber) => {
    if (cell) {
      ctx.fillRect(columnNumber * cellSize, rowNumber * cellSize, cellSize, cellSize);
    }
  }));
  canvas.setAttribute('class', 'thumbnail');
}

function addGame(key: string, game: ClientGameData, playing: boolean, completed: boolean,
                 list: HTMLElement, full: boolean, clickListener: (evt: MouseEvent) => void) {
  const li = document.createElement('li');
  list.append(li);

  li.addEventListener('click', clickListener);

  const anchor = document.createElement('a');
  li.append(anchor);
  anchor.setAttribute('href', `/play?game=${key}`);
  anchor.setAttribute('class',
      completed ? 'completed' : playing ? 'playing' : game.needsPublish ? 'draft' : 'unstarted');

  if (full) {
    createThumbnail(anchor, game);
  }

  const section = document.createElement('section');
  anchor.append(section);
  section.setAttribute('class', 'puzzleInfo');

  /* Name */
  {
    const name = document.createElement('span');
    section.append(name);
    name.setAttribute('class', 'name');
    name.append(game.name);
  }

  if (game.creator) {
    const creator = document.createElement('span');
    section.append(creator);
    creator.setAttribute('class', 'creator');
    creator.append(`by ${game.creator}`);
  }

  if (game.difficulty) {
    const name = document.createElement('span');
    section.append(name);
    name.setAttribute('class', 'difficulty');
    name.append(`Difficulty ${game.difficulty}`);
  }

  if (game.needsPublish) {
    const name = document.createElement('span');
    section.append(name);
    name.append('Draft');
  }

  /* Dimensions */
  {
    const dimensions = document.createElement('span');
    section.append(dimensions);
    dimensions.setAttribute('class', 'dimensions');
    dimensions.append(`${game.spec.width} x ${game.spec.height}`);
  }

  if (completed || playing) {
    const span = document.createElement('span');
    section.append(span);
    span.setAttribute('class', 'status');
    span.append(completed ? 'Completed' : 'In progress');
  }
}

async function main() {
  const list = notNull(document.getElementById('games'));
  const progress = document.createElement('img');
  list.append(progress);
  progress.setAttribute('src', '/images/progress.svg');

  const editSection = is(HTMLElement, document.body.querySelector('section.editSection'));

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

  const params = new URL(window.location.href).searchParams;
  const full = params.has('full');

  function clickEvent(evt: MouseEvent) {
    const li = evt.currentTarget;
    if (!(li instanceof HTMLLIElement)) {
      return;
    }
    if (!evt.ctrlKey && !evt.metaKey) {
      return;
    }
    if (li.classList.contains('selected')) {
      li.classList.remove('selected');
    } else {
      li.classList.add('selected');
    }
    const numberSelected = list.querySelectorAll('li.selected').length;
    if (numberSelected === 0) {
      if (editSection.style.getPropertyValue('visibility') === 'visible') {
        editSection.style.setProperty('visibility', 'hidden');
      }
    } else {
      if (editSection.style.getPropertyValue('visibility') === 'hidden') {
        editSection.style.setProperty('visibility', 'visible');
      }
    }
    evt.preventDefault();
  }

  if ((params.get('v') || 'local') === 'local') {
    for await (const result of await gamesDb
        .then(db => db.transaction('games', 'readonly')
            .objectStore('games').index('byDifficulty').openCursor())
        .then(requestToAsyncGenerator)) {
      const key = result.primaryKey.toString();
      addGame(key, result.value, plays.has(key), completed.has(key), list, full, clickEvent);
    }
    progress.remove();
  } else {
    const getParams = new URLSearchParams();
    ['creator', 'limit'].forEach(param => {
      const value = params.get(param);
      if (value) {
        getParams.set(param, value);
      }
    });
    axios.get(`/games?${getParams}`)
        .then(response => response.data as ClientGame[])
        .then(obj => {
          for (let game of obj) {
            if (typeof game.data.gridData !== 'string') {
              throw new Error();
            }
            // We write the incoming games to the local database (which needs
            // the grid decoding). Might not always be desirable.
            game.data.gridData = decode(game.data.spec, game.data.gridData);
            addGame(game.key, game.data, plays.has(game.key), completed.has(game.key), list, full,
                clickEvent);
            gamesDb.then(db => db.transaction('games', 'readwrite').objectStore('games')
                .put(game.data, game.key));
          }
        })
        .catch(e => {
          console.error(e);
          list.append(e.toString());
        })
        .finally(() => progress.remove());
  }
}

main().then();
