import axios from 'axios';
import {assertIs} from '../common/check/is';
import {assertNotNull} from '../common/check/null';
import {assertString} from '../common/check/string';
import {decode} from '../common/decoder';
import {ClientGame, GameData} from '../common/gameData';
import {parseGameId} from '../server/parseGameId';
import {bustCache} from './bustCache';
import {completedDb} from './db/completedDb';
import {gamesDb} from './db/gamesDb';
import {playsDb} from './db/playsDb';
import {getGame} from './fetchGame';
import {requestToAsyncGenerator} from './requestToAsyncGenerator';

function createThumbnail(parent: HTMLElement, game: GameData) {
  const canvas = document.createElement('canvas');
  parent.append(canvas);
  const ctx = assertNotNull(canvas.getContext('2d'));
  const cellSize = Math.ceil(60 / game.spec.width);
  canvas.width = game.spec.width * cellSize;
  canvas.height = game.spec.height * cellSize;
  ctx.fillStyle = 'lightblue';
  decode(game.spec, game.gridData).forEach((row, rowNumber) => row.forEach((cell, columnNumber) => {
    if (cell) {
      ctx.fillRect(columnNumber * cellSize, rowNumber * cellSize, cellSize, cellSize);
    }
  }));
  canvas.setAttribute('class', 'thumbnail');
}

function addGame(list: HTMLElement, key: string, game: GameData, playing: boolean,
                 completed: boolean, full: boolean, clickListener: (evt: MouseEvent) => void) {
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

  if (game.creator && game.creator !== 'auto') {
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
  const main = assertNotNull(document.getElementsByTagName('main')[0]);
  const list = document.createElement('ol');
  main.append(list);
  list.setAttribute('id', 'games');

  const progress = document.createElement('img');
  list.append(progress);
  progress.setAttribute('src', '/images/progress.svg');

  const editSection = assertIs(HTMLElement, document.body.querySelector('section.editSection'));

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

  // For aesthetic reasons the nude URL is equivalent to include=main.
  const params = window.location.search ?
      new URL(window.location.href).searchParams :
      new URLSearchParams({collection: 'main'});

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

  if (params.get('v') === 'local') {
    const included = new Set<string>();
    for (const gameId of plays) {
      getGame(gameId).then(game => {
        included.add(gameId);
        addGame(list, gameId, game, true, completed.has(gameId), full, clickEvent)
      });
    }

    for await (const result of await gamesDb
        .then(db => db.transaction('games', 'readonly')
            .objectStore('games').index('byDifficulty').openCursor())
        .then(requestToAsyncGenerator)) {
      const key = result.primaryKey.toString();
      if (included.has(key)) {
        return;
      }
      addGame(list, key, result.value, plays.has(key), completed.has(key), full, clickEvent);
    }
    progress.remove();
  } else {
    const collection_ = assertNotNull(params.get('collection'));
    axios.get(`/games?collection=${collection_}`)
        .then(response => response.data as ClientGame[])
        .then(games => {
          const changeCollectionForm =
              assertIs(HTMLFormElement, document.body.querySelector('form.changeCollectionForm'));
          changeCollectionForm.addEventListener('submit', evt => {
            const gameIds = [...list.querySelectorAll('li.selected')].map(li => {
              const anchor = assertNotNull(li.querySelector('a'));
              const url = new URL(anchor.href);
              return assertString(url.searchParams.get('game'));
            });
            const formData = new FormData(changeCollectionForm);
            const newCollection = formData.get('collection');
            Promise.all(gameIds.map(gameId => {
              const clientGame = games.find(game => game.key === gameId);
              if (!clientGame) {
                throw new Error();
              }
              const {collection, rawName} = parseGameId(gameId);
              const newClientGame: ClientGame = {
                key: `${newCollection}.${rawName}`,
                data: clientGame.data
              };
              return axios.post('/publish', newClientGame)
                  .then(response => response.data)
                  .then(() => axios.post('/delete', {gameId}));
            })).then(() => bustCache(`/games?collection=${newCollection}`))
                .then(() => bustCache(`/games?collection=${collection_}`))
                .then(() => location.reload());
            evt.preventDefault();
          });

          for (let game of games) {
            addGame(list, game.key, game.data, plays.has(game.key), completed.has(game.key), full, clickEvent);
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
