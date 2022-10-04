import {Analyze} from '/src/client/analyze.js';
import {GamesDb} from './db/games_db';
import {decode} from './decoder';
import {encode} from './encoder';
import {get_game} from '/src/client/fetch_game.js';
import {Generate} from './generate';
import {generateClues} from '/src/client/generate_clues.js';
import {plotLine} from './plot_line';
import {Renderer} from '/src/client/renderer.js';
import {request} from './request';
import Alea from 'alea';

class Edit {
  constructor() {
    this.games_db = new GamesDb();
    const title = document.getElementById('title');
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
      selection.removeAllRanges();
      selection.addRange(range);
    });

    title.addEventListener('blur', evt => {
      this.name = title.textContent;
      if (title.textContent === this.name) {
        title.textContent = this.name;
        this.needs_publish = true;
        this.saveLocal();
      }
    });

    document.getElementById('status').innerText = 'Edit mode';

    document.getElementById('create_new').addEventListener('click', evt => {
      window.location.href = 'edit';
    });

    document.getElementById('play').addEventListener('click', evt => {
      window.location.href = `/play?game=${this.game_id}`;
    });

    document.getElementById('analyze').addEventListener('click', evt => {
      let clues = generateClues(this.spec, this.data);
      Analyze.visualAnalyze(this.spec, clues);
    });

    document.getElementById('publish').addEventListener('click', evt => {
      if (this.name === 'Untitled' || this.name === '') {
        this.name = prompt('Enter a name for your puzzle');
        this.saveLocal();
        this.repaint();
      }
      const data = this.getData();
      // We don't technically need to uuencode the grid at this stage, but
      // big boolean arrays aren't transport or server friendly.
      data.grid_data = encode(data.grid_data);
      data.game_id = this.game_id;
      request('/publish', 'POST', data, evt => {
        if (!evt.target.response) {
          alert('failure');
          return;
        }

        const obj = JSON.parse(evt.target.response);
        if (obj.login) {
          window.location.href = obj.login;
        } else if (obj.exception) {
          alert(obj.exception);
        } else {
          const game = obj.game.data;
          const new_id = obj.game.key;
          game.grid_data = decode(game.spec, game.grid_data);

          this.needs_publish = false;
          if (this.game_id !== new_id) {
            this.games_db.delete_item(this.game_id);
            this.game_id = new_id;
            window.history.replaceState({}, '', `edit?game=${this.game_id}`);
          }
          this.games_db.set(this.game_id, game);
          const publish = document.getElementById('publish');
          publish.setAttribute('disabled', '');

          alert(`Difficulty ${game.difficulty}`);
        }
      });
    });

    document.getElementById('cancel').addEventListener('click', evt => {
      // Defined as 'delete any local changes and restore to the published
      // version'.

      // We don't have a local copy so must refresh from server. Requires
      // internet. May not be the best solution.
      get_game(this.games_db, this.game_id, game => {
        this.spec = game.spec;
        this.data = game.grid_data;
        this.name = game.name;
        this.repaint();
      }, () => {});
    });

    document.getElementById('delete').addEventListener('click', evt => {
      // Local delete
      this.games_db.delete_item(this.game_id);
      // Remove delete
      request('/delete', 'POST', {game_id: this.game_id}, evt => {
        if (!evt.target.response) {
          alert('failure');
        }
        window.location.href = window.location.origin;
      });
    });

    document.getElementById('grid_size').addEventListener('change', evt => {
      const spec = JSON.parse(evt.target.value);
      this.makeNewGame(spec, false);
    });

    document.getElementById('color_scheme').addEventListener('change', evt => {
      this.style = evt.target.value;
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

    this.game_id = new URL(window.location.href).searchParams.get('game') || undefined;
    this.needs_publish = false;
    const default_spec = {width: 20, height: 20};

    if (this.game_id) {
      get_game(
          this.games_db, this.game_id,
          game => {
            this.spec = game.spec;
            this.data = game.grid_data;
            this.name = game.name;
            this.style = game.style;
            this.needs_publish = game.needs_publish;
            this.renderer = new Renderer(svg, this.spec);
            this.repaint();
          },
          error => {
            this.makeNewGame(default_spec, true);
          });
    } else {
      // Otherwise make a new game.
      this.makeNewGame(default_spec, true);
    }
  }

  getData() {
    return {
      grid_data: this.data,
      spec: this.spec,
      name: this.name,
      style: this.style
    };
  }

  saveLocal() {
    const data = this.getData();
    data.needs_publish = this.needs_publish;
    data.difficulty = Analyze.analyze(
        this.spec, generateClues(this.spec, this.data), () => {});
    this.games_db.set(this.game_id, data);
  }

  repaint() {
    const title = document.getElementById('title');
    title.textContent = this.name;
    this.renderer.paintOnSquares(this.data);
    let clues = generateClues(this.spec, this.data);
    this.renderer.paintClues(clues);
    const grid_size = document.getElementById('grid_size');
    grid_size.value =
        `{"width": ${this.spec.width}, "height": ${this.spec.height}}`;
    const color_scheme = document.getElementById('color_scheme');
    color_scheme.value = this.style;
    const publish = document.getElementById('publish');
    if (this.needs_publish) {
      publish.removeAttribute('disabled');
    } else {
      publish.setAttribute('disabled', '');
    }
    if (this.setStyle !== this.style) {
      const color_scheme_stylesheet =
          document.getElementById('color_scheme_stylesheet');
      color_scheme_stylesheet.href = `/styles/color_schemes/${this.style}.css`;
      this.setStyle = this.style;
    }
  }

  makeNewGame(spec, replace) {
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
