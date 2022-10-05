import {Spec} from '../common/spec';
import {Analyze} from './analyze';
import {CompletedDb} from './db/completed_db';
import {GamesDb} from './db/games_db';
import {PlaysDb} from './db/plays_db';
import {getGame} from './fetch_game';
import {Generate} from './generate';
import {generateClues} from './generate_clues';
import {plotLine} from './plot_line';
import {Renderer} from './renderer';

class Play {
  private readonly gamesDb: GamesDb;
  private readonly playsDb: PlaysDb;
  private readonly completedDb: CompletedDb;
  private readonly gameId: string;
  private rowLock: number | false = false;
  private columnLock: number | false = false;
  private spec: Spec = {width: 0, height: 0};
  private clues: number[][][] = [];
  private data: boolean[][] = [];
  private style = '';
  private renderer: Renderer | undefined;
  private on: boolean[][] = [];
  private off: boolean[][] = [];
  private lastX = -1;
  private lastY = -1;

  constructor() {
    this.gamesDb = new GamesDb();
    this.playsDb = new PlaysDb();
    this.completedDb = new CompletedDb();
    this.rowLock = false;
    this.columnLock = false;
    this.gameId = new URL(window.location.href).searchParams.get('game') || '';

    const svg = document.getElementsByTagName('svg')[0];
    if (!(svg instanceof SVGSVGElement)) {
      throw new Error();
    }
    getGame(
        this.gamesDb, this.gameId,
        result => {
          if (typeof result.grid_data !== 'object') {
            throw new Error();
          }
          this.spec = result.spec;
          this.data = result.grid_data;
          this.style = result.style;
          this.on = Generate.getEmpty(this.spec);
          this.off = Generate.getEmpty(this.spec);
          this.renderer = new Renderer(svg, this.spec);
          const colorSchemeStylesheet = document.getElementById('color_scheme_stylesheet');
          if (!(colorSchemeStylesheet instanceof HTMLLinkElement)) {
            throw new Error();
          }
          colorSchemeStylesheet.href = `/styles/color_schemes/${this.style}.css`;
          const title = document.getElementById('title');
          if (!title) {
            throw new Error();
          }
          title.textContent = result.name;
          this.clues = generateClues(this.spec, this.data);
          this.renderer.paintClues(this.clues);
          this.playsDb.get(this.gameId).then(data => {
            if (!data) {
              return;
            }
            this.on = data.on;
            this.off = data.off;

            this.fromScratch();
          });
        },
        () => {
          alert('bad game');
        });

    const replay = document.getElementById('replay');
    const edit = document.getElementById('edit');
    const hint = document.getElementById('hint');

    if (!replay || !edit || !hint) {
      throw new Error();
    }

    replay.addEventListener('click', () => {
      this.on = Generate.getEmpty(this.spec);
      this.off = Generate.getEmpty(this.spec);
      this.fromScratch();
    });

    edit.addEventListener('click', () => {
      window.location.href = `edit?game=${this.gameId}`;
    });

    hint.addEventListener('click', () => {
      if (!this.renderer) {
        throw new Error();
      }
      this.renderer.setHighlightMode('hint');
      const hint = Analyze.findHint(this.spec, this.clues, this.on, this.off);
      this.renderer.setHighlightRow(hint[0]);
      this.renderer.setHighlightColumn(hint[1]);
    });

    const ActionMode = {
      NOT_DRAWING: 0,
      SETTING_ON: 1,
      SETTING_OFF: 2,
      SET_UNKNOWN: 3,
    };

    let actionMode = ActionMode.NOT_DRAWING;

    svg.addEventListener('contextmenu', evt => {
      evt.preventDefault();
    });

    svg.addEventListener('mousedown', evt => {
      if (!this.renderer) {
        throw new Error();
      }
      this.renderer.mousedown(evt, (renderer, x, y, which, shiftKey) => {
        if (x >= 0 && x < this.spec.width && y >= 0 && y < this.spec.height) {
          if (which === 3 || shiftKey) {
            // Right click.
            if (this.off[y][x]) {
              actionMode = ActionMode.SET_UNKNOWN;
              this.on[y][x] = false;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            } else if (!this.off[y][x]) {
              actionMode = ActionMode.SETTING_OFF;
              this.on[y][x] = false;
              this.off[y][x] = true;
              this.checkColumn(x);
              this.checkRow(y);
            }
          } else {
            if (this.on[y][x]) {
              actionMode = ActionMode.SET_UNKNOWN;
              this.on[y][x] = false;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            } else if (!this.on[y][x]) {
              actionMode = ActionMode.SETTING_ON;
              this.on[y][x] = true;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            }
          }
          this.lastX = x;
          this.lastY = y;
          this.repaint()
        }
      });
    });

    svg.addEventListener('mousemove', evt => {
      if (!this.renderer) {
        return;
      }
      this.renderer.mousemove(evt, (renderer, x, y) => {
        if (!this.renderer) {
          throw new Error();
        }
        if (actionMode !== ActionMode.NOT_DRAWING && x >= 0 &&
            x < this.spec.width && y >= 0 && y < this.spec.height) {
          if (this.rowLock === false && this.columnLock === false) {
            if (this.lastY !== y) {
              this.columnLock = x;
              this.renderer.setHighlightMode('locked');
              renderer.setHighlightColumn(x);
              renderer.setHighlightRow(-1);
            } else if (this.lastX !== x) {
              this.rowLock = y;
              this.renderer.setHighlightMode('locked');
              renderer.setHighlightColumn(-1);
              renderer.setHighlightRow(y);
            }
          }
          if (this.columnLock !== false) {
            x = this.columnLock;
          } else if (this.rowLock !== false) {
            y = this.rowLock;
          }

          let columnModified = new Set<number>();
          let rowModified = new Set<number>();
          let modified = false;
          for (let p of plotLine(this.lastX, this.lastY, x, y)) {
            if (actionMode === ActionMode.SETTING_ON) {
              if (!this.on[p.y][p.x]) {
                this.on[p.y][p.x] = true;
                this.off[p.y][p.x] = false;
                modified = true;
                columnModified.add(p.x);
                rowModified.add(p.y);
              }
            } else if (actionMode === ActionMode.SETTING_OFF) {
              if (!this.off[p.y][p.x]) {
                this.on[p.y][p.x] = false;
                this.off[p.y][p.x] = true;
                modified = true;
                columnModified.add(p.x);
                rowModified.add(p.y);
              }
            } else if (actionMode === ActionMode.SET_UNKNOWN) {
              if (this.on[p.y][p.x] || this.off[p.y][p.x]) {
                this.on[p.y][p.x] = false;
                this.off[p.y][p.x] = false;
                modified = true;
                columnModified.add(p.x);
                rowModified.add(p.y);
              }
            }
          }
          this.lastX = x;
          this.lastY = y;
          if (modified) {
            for (let column of columnModified) {
              this.checkColumn(column);
            }
            for (let row of rowModified) {
              this.checkRow(row);
            }
            this.repaint();
          }
        }
        if (this.rowLock === false && this.columnLock === false) {
          if (x >= 0 && x < this.spec.width) {
            this.renderer.setHighlightMode('hover');
            renderer.setHighlightColumn(x);
          }
          if (y >= 0 && y < this.spec.height) {
            this.renderer.setHighlightMode('hover');
            renderer.setHighlightRow(y);
          }
        }
      });
    });

    document.addEventListener('mouseup', evt => {
      if (!this.renderer) {
        throw new Error();
      }
      actionMode = ActionMode.NOT_DRAWING;
      this.rowLock = false;
      this.columnLock = false;

      this.renderer.setHighlightMode('hover');
      if (this.lastX !== -1) {
        this.renderer.setHighlightColumn(this.lastX);
      }

      this.renderer.setHighlightMode('hover');
      if (this.lastY !== -1) {
        this.renderer.setHighlightRow(this.lastY);
      }
    });
  }

  checkColumn(column: number) {
    if (!this.renderer) {
      throw new Error();
    }
    const clue = this.clues[1][column];
    const complete = [];
    while (complete.length < clue.length) {
      complete.push(-1);
    }
    const valid = Analyze.checkColumn(
        this.spec, this.on, this.off, column, clue, complete);
    this.renderer.setColumnValid(column, valid, complete);
  }

  checkRow(row: number) {
    if (!this.renderer) {
      throw new Error();
    }
    const clue = this.clues[0][row];
    const complete = [];
    while (complete.length < clue.length) {
      complete.push(-1);
    }
    const valid =
        Analyze.checkRow(this.spec, this.on, this.off, row, clue, complete);
    this.renderer.setRowValid(row, valid, complete);
  }

  repaint() {
    if (!this.renderer) {
      throw new Error();
    }
    const svg = document.getElementsByTagName('svg')[0];
    if (!(svg instanceof SVGSVGElement)) {
      throw new Error();
    }
    this.playsDb.set(this.gameId, {on: this.on, off: this.off});
    this.renderer.paintOnSquares(this.on);
    this.renderer.paintOffSquares(this.off);
    /* Check is complete */
    if (Generate.equals(this.on, this.data)) {
      svg.classList.add('game_complete');
      this.completedDb.set(this.gameId, {});
    } else {
      svg.classList.remove('game_complete');
    }
  }

  fromScratch() {
    for (let column = 0; column !== this.spec.width; column++) {
      this.checkColumn(column);
    }
    for (let row = 0; row !== this.spec.height; row++) {
      this.checkRow(row);
    }
    this.repaint();
  }
}

new Play();
