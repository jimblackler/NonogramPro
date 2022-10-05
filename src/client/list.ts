import {ClientGameData} from '../common/clientGame';
import {GamesDb} from './db/games_db';
import {PlaysDb} from './db/plays_db';
import {decode} from './decoder';
import {request} from './request';

class List {
  private games_db: GamesDb;
  private plays_db: PlaysDb;

  constructor() {
    this.games_db = new GamesDb();
    this.plays_db = new PlaysDb();
    const plays = new Set();
    this.plays_db.list(evt => {
      const currentTarget = evt.currentTarget;
      if (!(currentTarget instanceof IDBRequest)) {
        throw new Error();
      }
      const result = currentTarget.result;
      if (result) {
        plays.add(result.key);
        result.continue();
      } else {
        const list = document.getElementById('games');
        if (!(list instanceof HTMLElement)) {
          throw new Error();
        }
        if ((new URL(window.location.href).searchParams.get('v') || 'local') === 'local') {
          this.games_db.list(evt => {
            const currentTarget = evt.currentTarget;
            if (!(currentTarget instanceof IDBRequest)) {
              throw new Error();
            }
            const result = currentTarget.result;
            if (result) {
              List.addGame(
                  result.primaryKey, result.value, plays.has(result.key), list);
              result.continue();
            }
          });
        } else {
          request('/games', 'GET', {}, evt => {
            const target = evt.target;
            if (!(target instanceof XMLHttpRequest)) {
              throw new Error();
            }
            const obj = JSON.parse(target.response);
            for (let game of obj.results) {
              List.addGame(game.key, game.data, plays.has(game.key), list);
              // We write the incoming games to the local database (which needs
              // the grid decoding). Might not always be desirable.
              game.data.grid_data = decode(game.data.spec, game.data.grid_data);
              this.games_db.set(game.key, game.data);
            }
          });
        }
      }
    });
  }

  static addGame(key: string, game: ClientGameData, playing: boolean, list: HTMLElement) {
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

    if (game.needs_publish) {
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
}

new List();
