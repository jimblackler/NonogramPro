import axios from 'axios';
import {isDefined} from '../common/check/defined';
import {assertIs} from '../common/check/is';
import {assertNotNull} from '../common/check/null';
import {assertString} from '../common/check/string';
import {ClientGame} from '../common/gameData';
import {parseGameId} from '../common/parseGameId';
import {bustCache} from './bustCache';
import {completedDb} from './db/completedDb';
import {gamesDb} from './db/gamesDb';
import {playsDb} from './db/playsDb';
import {getGame} from './fetchGame';
import {addGame} from './gameInList';
import {requestToAsyncGenerator} from './requestToAsyncGenerator';

async function main() {
  const main = assertNotNull(document.getElementsByTagName('main')[0]);

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
    const gameId = currentTarget.key.toString();
    completed.add(gameId);
    plays.delete(gameId);
  }

  // For aesthetic reasons the nude URL is equivalent to include=main.
  const params = window.location.search ?
      new URL(window.location.href).searchParams :
      new URLSearchParams({collection: 'main'});

  const full = params.has('full');

  if (params.get('v') === 'local') {
    const playData = (await Promise.all([...plays].map(
        gameId => getGame(gameId)
            .then(game => ({gameId, game})).catch(() => undefined)))).filter(isDefined);
    if (playData.length) {
      const title = document.createElement('h2');
      main.append(title);
      title.append(`Games you're playing`);

      const list = document.createElement('ol');
      main.append(list);
      list.setAttribute('id', 'games');
      for (const {gameId, game} of playData) {
        addGame(list, gameId, game, true, false, full, () => {
        });
      }
    }

    const completedData = (await Promise.all([...completed].map(
        gameId => getGame(gameId)
            .then(game => ({gameId, game})).catch(() => undefined)))).filter(isDefined);
    if (completedData.length) {
      const title = document.createElement('h2');
      main.append(title);
      title.append(`Games you've completed`);

      const list = document.createElement('ol');
      main.append(list);
      list.setAttribute('id', 'games');

      for (const {game, gameId} of completedData) {
        addGame(list, gameId, game, true, true, full, () => {
        });
      }
    }

    {
      const title = document.createElement('h2');
      main.append(title);
      title.append(`Games you're creating`);

      const list = document.createElement('ol');
      main.append(list);
      list.setAttribute('id', 'games');

      const progress = document.createElement('img');
      list.append(progress);
      progress.setAttribute('src', '/images/progress.svg');

      for await (const result of await gamesDb
          .then(db => db.transaction('games', 'readonly')
              .objectStore('games').index('byDifficulty').openCursor())
          .then(requestToAsyncGenerator)) {
        const key = result.primaryKey.toString();
        addGame(list, key, result.value, plays.has(key), completed.has(key), full, () => {
        });
      }
      const li = document.createElement('li');
      list.append(li);

      const a = document.createElement('a');
      li.append(a);
      a.setAttribute('class', 'createGame');
      a.setAttribute('href', '/edit');
      a.append('Create a game');

      progress.remove();
    }
  } else {
    const list = document.createElement('ol');
    main.append(list);
    list.setAttribute('id', 'games');

    const progress = document.createElement('img');
    list.append(progress);
    progress.setAttribute('src', '/images/progress.svg');

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

require('./requestScreenName');
