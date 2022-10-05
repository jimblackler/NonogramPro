import Alea from 'alea';
import {Spec} from '../common/spec';
import {Analyze} from './analyze';
import {GamesDb} from './db/games_db';
import {decode} from './decoder';
import {encode} from './encoder';
import {get_game} from './fetch_game';
import {Generate} from './generate';
import {generateClues} from './generate_clues';
import {plotLine} from './plot_line';
import {Renderer} from './renderer';
import {request} from './request';

class Edit {
  private readonly games_db: GamesDb;

  private renderer: Renderer | undefined;
  private data: boolean[][] = [];
  private game_id = '';
  private name = '';
  private needs_publish = false;
  private spec: Spec = {width: 0, height: 0};
  private style = '';
  private setStyle = '';
  private last_x = 0;
  private last_y = 0;

  constructor() {
    this.games_db = new GamesDb();
    const title = document.getElementById('title');
    const status = document.getElementById('status');
    const createNew = document.getElementById('create_new');
    const play = document.getElementById('play');
    const analyze = document.getElementById('analyze');
    const publish = document.getElementById('publish');
    const cancel = document.getElementById('cancel');
    const delete_ = document.getElementById('delete');
    const gridSize = document.getElementById('grid_size');
    const colorScheme = document.getElementById('color_scheme');

    if (!title || !status || !createNew || !play || !analyze || !publish || !cancel || !delete_ ||
        !gridSize || !colorScheme) {
      throw new Error();
    }
    title.setAttribute('contenteditable', 'true');

    title.addEventListener('keypress', evt => {
      if (evt.keyCode === 10 || evt.keyCode === 13) {
        title.blur();
        evt.preventDefault();
      }
    });

    title.addEventListener('focus', evt => {
      const range = document.createRange();
      range.selectNodeContents(title);
      const selection = window.getSelection();
      if (!selection) {
        throw new Error();
      }
      selection.removeAllRanges();
      selection.addRange(range);
    });

    title.addEventListener('blur', evt => {
      this.name = title.textContent || '';
      if (title.textContent === this.name) {
        title.textContent = this.name;
        this.needs_publish = true;
        this.saveLocal();
      }
    });

    status.innerText = 'Edit mode';

    createNew.addEventListener('click', evt => {
      window.location.href = 'edit';
    });
    play.addEventListener('click', evt => {
      window.location.href = `/play?game=${this.game_id}`;
    });

    analyze.addEventListener('click', evt => {
      let clues = generateClues(this.spec, this.data);
      Analyze.visualAnalyze(this.spec, clues);
    });

    publish.addEventListener('click', evt => {
      if (this.name === 'Untitled' || this.name === '') {
        this.name = prompt('Enter a name for your puzzle') || '';
        this.saveLocal();
        this.repaint();
      }
      const data = {
        ...this.getData(),
        game_id: this.game_id
      };
      // We don't technically need to uuencode the grid at this stage, but
      // big boolean arrays aren't transport or server friendly.
      if (typeof data.grid_data !== 'object') {
        throw new Error();
      }
      data.grid_data = encode(data.grid_data);
      request('/publish', 'POST', data, evt => {
        const target = evt.target;
        if (!(target instanceof XMLHttpRequest)) {
          throw new Error();
        }
        if (!target.response) {
          alert('failure');
          return;
        }

        const obj = JSON.parse(target.response);
        if (obj.login) {
          window.location.href = obj.login;
        } else if (obj.exception) {
          alert(obj.exception);
        } else {
          const game = obj.game.data;
          const new_id = obj.game.key;
          if (typeof game.grid_data != 'string') {
            throw new Error();
          }

          game.grid_data = decode(game.spec, game.grid_data);

          this.needs_publish = false;
          if (this.game_id !== new_id) {
            this.games_db.deleteItem(this.game_id);
            this.game_id = new_id;
            window.history.replaceState({}, '', `edit?game=${this.game_id}`);
          }
          this.games_db.set(this.game_id, game);
          publish.setAttribute('disabled', '');

          alert(`Difficulty ${game.difficulty}`);
        }
      });
    });

    cancel.addEventListener('click', evt => {
      // Defined as 'delete any local changes and restore to the published
      // version'.

      // We don't have a local copy so must refresh from server. Requires
      // internet. May not be the best solution.
      get_game(this.games_db, this.game_id, game => {
        if (typeof game.grid_data !== 'object') {
          throw new Error();
        }
        this.spec = game.spec;
        this.data = game.grid_data;
        this.name = game.name;
        this.repaint();
      }, () => {});
    });

    delete_.addEventListener('click', evt => {
      // Local delete
      this.games_db.deleteItem(this.game_id);
      // Remove delete
      request('/delete', 'POST', {game_id: this.game_id}, evt => {
        if (!(evt.target instanceof XMLHttpRequest)) {
          throw new Error();
        }
        if (!evt.target.response) {
          alert('failure');
        }
        window.location.href = window.location.origin;
      });
    });

    gridSize.addEventListener('change', evt => {
      const target = evt.target;
      if (!(target instanceof HTMLSelectElement)) {
        throw new Error();
      }
      const spec = JSON.parse(target.value);
      this.makeNewGame(spec, false);
    });

    colorScheme.addEventListener('change', evt => {
      const target = evt.target;
      if (!(target instanceof HTMLSelectElement)) {
        throw new Error();
      }
      this.style = target.value;
      this.needs_publish = true;
      this.repaint();
      this.saveLocal();
    });

    const DrawMode = {
      NOT_DRAWING: 0,
      SETTING: 1,
      DELETING: 2,
    };

    let drawMode = DrawMode.NOT_DRAWING;

    const svg = document.getElementsByTagName('svg')[0];
    svg.addEventListener('contextmenu', evt => {
      evt.preventDefault();
    });
    svg.addEventListener('mousedown', evt => {
      if (!this.renderer) {
        throw new Error();
      }
      this.renderer.mousedown(evt, (renderer, x, y, which) => {
        if (x >= 0 && x < this.spec.width && y >= 0 && y < this.spec.height) {
          if (this.data[y][x]) {
            drawMode = DrawMode.DELETING;
            this.data[y][x] = false;
            this.needs_publish = true;
          } else {
            drawMode = DrawMode.SETTING;
            this.data[y][x] = true;
            this.needs_publish = true;
          }
          this.last_x = x;
          this.last_y = y;
          this.repaint();
        }
      });
    });

    svg.addEventListener('mousemove', evt => {
      if (!this.renderer) {
        return;
      }
      this.renderer.mousemove(evt, (renderer, x, y) => {
        if (drawMode === DrawMode.NOT_DRAWING) {
          return;
        }
        let modified = false;
        if (x >= 0 && x < this.spec.width && y >= 0 && y < this.spec.height) {
          for (let p of plotLine(this.last_x, this.last_y, x, y)) {
            if (drawMode === DrawMode.SETTING) {
              if (!this.data[p.y][p.x]) {
                this.data[p.y][p.x] = true;
                modified = true;
                this.needs_publish = true;
              }
            } else if (drawMode === DrawMode.DELETING) {
              if (this.data[p.y][p.x]) {
                this.data[p.y][p.x] = false;
                modified = true;
                this.needs_publish = true;
              }
            }
          }
          this.last_x = x;
          this.last_y = y;
          if (modified) {
            this.repaint();
          }
        }
      });
    });

    document.addEventListener('mouseup', evt => {
      drawMode = DrawMode.NOT_DRAWING;
      if (this.needs_publish) {
        this.saveLocal();
      }
    });

    const gameId = new URL(window.location.href).searchParams.get('game');
    if (!gameId) {
      throw new Error();
    }
    this.game_id = gameId;
    this.needs_publish = false;
    const default_spec = {width: 20, height: 20};

    if (this.game_id) {
      get_game(
          this.games_db, this.game_id,
          game => {
            this.spec = game.spec;
            if (typeof game.grid_data !== 'object') {
              throw new Error();
            }
            this.data = game.grid_data;
            this.name = game.name;
            this.style = game.style;
            this.needs_publish = game.needs_publish || false;
            this.renderer = new Renderer(svg, this.spec);
            this.repaint();
          },
          () => {
            this.makeNewGame(default_spec, true);
          });
    } else {
      // Otherwise make a new game.
      this.makeNewGame(default_spec, true);
    }
  }

  getData() {
    return {
      grid_data: this.data as string | boolean[][],
      spec: this.spec,
      name: this.name,
      style: this.style,
    };
  }

  saveLocal() {
    const data = {
      ...this.getData(),
      needs_publish: this.needs_publish,
      difficulty: Analyze.analyze(
          this.spec, generateClues(this.spec, this.data), () => {
          })
    };
    this.games_db.set(this.game_id, data);
  }

  repaint() {
    const title = document.getElementById('title');
    const grid_size = document.getElementById('grid_size');
    const color_scheme = document.getElementById('color_scheme');
    const publish = document.getElementById('publish');
    const color_scheme_stylesheet = document.getElementById('color_scheme_stylesheet');

    if (!title || !(grid_size instanceof HTMLSelectElement) ||
        !(color_scheme instanceof HTMLSelectElement) || !this.renderer || !publish ||
        !(color_scheme_stylesheet instanceof HTMLLinkElement)) {
      throw new Error();
    }
    title.textContent = this.name;
    this.renderer.paintOnSquares(this.data);
    let clues = generateClues(this.spec, this.data);
    this.renderer.paintClues(clues);

    grid_size.value =
        `{"width": ${this.spec.width}, "height": ${this.spec.height}}`;

    color_scheme.value = this.style;

    if (this.needs_publish) {
      publish.removeAttribute('disabled');
    } else {
      publish.setAttribute('disabled', '');
    }
    if (this.setStyle !== this.style) {
      color_scheme_stylesheet.href = `/styles/color_schemes/${this.style}.css`;
      this.setStyle = this.style;
    }
  }

  makeNewGame(spec: Spec, replace: boolean) {
    const random = Alea();
    this.game_id = `draft${random() * 10000 | 0}`;
    const url = `edit?game=${this.game_id}`;
    if (replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    this.spec = spec;
    this.style = 'midnight';
    this.data = Generate.getEmpty(this.spec);
    this.name = 'Untitled';
    const svg = document.getElementsByTagName('svg')[0];
    this.renderer = new Renderer(svg, this.spec);
    this.repaint();
  }
}

new Edit();
