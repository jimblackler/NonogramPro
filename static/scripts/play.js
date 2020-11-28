'use strict';


class Play {
  checkColumn(column) {
    const clue = this.clues[1][column];
    const complete = [];
    while (complete.length < clue.length) {
      complete.push(-1);
    }
    const valid =
        checkColumn(this.spec, this.on, this.off, column, clue, complete);
    this.renderer.setColumnValid(column, valid, complete);
  }

  checkRow(row) {
    const clue = this.clues[0][row];
    const complete = [];
    while (complete.length < clue.length) {
      complete.push(-1);
    }
    const valid = checkRow(this.spec, this.on, this.off, row, clue, complete);
    this.renderer.setRowValid(row, valid, complete);
  }

  repaint() {
    this.plays_db.set(this.game_id, {on: this.on, off: this.off});
    this.renderer.paintOnSquares(this.on);
    this.renderer.paintOffSquares(this.off);
    /* Check is complete */
    if (equals(this.on, this.data)) {
      this.svg.classList.add('game_complete');
      this.completed_db.set(this.game_id, {});
    } else {
      this.svg.classList.remove('game_complete');
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

  constructor() {
    this.games_db = new GamesDb();
    this.plays_db = new PlaysDb();
    this.completed_db = new CompletedDb();
    this.row_lock = false;
    this.column_lock = false;
    this.game_id = gup('game');
    get_game(this.games_db, this.game_id, result => {
      this.spec = result.spec;
      this.data = result.grid_data;
      this.style = result.style;
      this.on = getEmpty(this.spec);
      this.off = getEmpty(this.spec);
      this.renderer = new Renderer(this.svg, this.spec);
      const color_scheme_stylesheet =
        document.getElementById('color_scheme_stylesheet');
      color_scheme_stylesheet.href = `/styles/color_schemes/${this.style}.css`;
      const title = document.getElementById('title');
      title.textContent = result.name;
      this.clues = generateClues(this.spec, this.data);
      this.renderer.paintClues(this.clues);
      this.plays_db.get(this.game_id).then(data => {
        if (!data) {
          return;
        }
        this.on = data.on;
        this.off = data.off;

        this.fromScratch();
      });
    }, error => {
      alert('bad game');
    });

    document.getElementById('replay').addEventListener('click', () => {
      this.on = getEmpty(this.spec);
      this.off = getEmpty(this.spec);
      this.fromScratch();
    });

    document.getElementById('edit').addEventListener('click', () => {
      window.location.href = `edit?game=${this.game_id}`;
    });

    document.getElementById('hint').addEventListener('click', () => {
      this.renderer.setHighlightMode('hint');
      const hint = findHint(this.spec, this.clues, this.on, this.off);
      this.renderer.setHighlightRow(hint[0]);
      this.renderer.setHighlightColumn(hint[1]);
    });

    const ActionMode = {
      NOT_DRAWING: 0, SETTING_ON: 1, SETTING_OFF: 2, SET_UNKNOWN: 3,
    };

    let action_mode = ActionMode.NOT_DRAWING;


    this.svg = document.getElementsByTagName('svg')[0];
    this.svg.addEventListener('contextmenu', evt => {
      evt.preventDefault();
    });

    this.svg.addEventListener('mousedown', evt => {
      this.renderer.mousedown(evt, (renderer, x, y, which, shiftKey) => {
        if (x >= 0 && x < this.spec.width && y >= 0 && y < this.spec.height) {
          if (which === 3 || shiftKey) {
            // Right click.
            if (this.off[y][x]) {
              action_mode = ActionMode.SET_UNKNOWN;
              this.on[y][x] = false;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            } else if (!this.off[y][x]) {
              action_mode = ActionMode.SETTING_OFF;
              this.on[y][x] = false;
              this.off[y][x] = true;
              this.checkColumn(x);
              this.checkRow(y);
            }
          } else {
            if (this.on[y][x]) {
              action_mode = ActionMode.SET_UNKNOWN;
              this.on[y][x] = false;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            } else if (!this.on[y][x]) {
              action_mode = ActionMode.SETTING_ON;
              this.on[y][x] = true;
              this.off[y][x] = false;
              this.checkColumn(x);
              this.checkRow(y);
            }
          }
          this.last_x = x;
          this.last_y = y;
          this.repaint()
        }
      });
    });

    this.svg.addEventListener('mousemove', evt => {
      if (!this.renderer) {
        return;
      }
      this.renderer.mousemove(evt, (renderer, x, y) => {
        if (action_mode !== ActionMode.NOT_DRAWING && x >= 0 &&
            x < this.spec.width && y >= 0 && y < this.spec.height) {
          if (this.row_lock === false && this.column_lock === false) {
            if (this.last_y !== y) {
              this.column_lock = x;
              this.renderer.setHighlightMode('locked');
              renderer.setHighlightColumn(x);
              renderer.setHighlightRow(-1);
            } else if (this.last_x !== x) {
              this.row_lock = y;
              this.renderer.setHighlightMode('locked');
              renderer.setHighlightColumn(-1);
              renderer.setHighlightRow(y);

            }
          }
          if (this.column_lock !== false) {
            x = this.column_lock;
          } else if (this.row_lock !== false) {
            y = this.row_lock;
          }

          let column_modified = new Set();
          let row_modified = new Set();
          let modified = false;
          for (let p of plotLine(this.last_x, this.last_y, x, y)) {
            if (action_mode === ActionMode.SETTING_ON) {
              if (!this.on[p.y][p.x]) {
                this.on[p.y][p.x] = true;
                this.off[p.y][p.x] = false;
                modified = true;
                column_modified.add(p.x);
                row_modified.add(p.y);
              }
            } else if (action_mode === ActionMode.SETTING_OFF) {
              if (!this.off[p.y][p.x]) {
                this.on[p.y][p.x] = false;
                this.off[p.y][p.x] = true;
                modified = true;
                column_modified.add(p.x);
                row_modified.add(p.y);
              }
            } else if (action_mode === ActionMode.SET_UNKNOWN) {
              if (this.on[p.y][p.x] || this.off[p.y][p.x]) {
                this.on[p.y][p.x] = false;
                this.off[p.y][p.x] = false;
                modified = true;
                column_modified.add(p.x);
                row_modified.add(p.y);
              }
            }
          }
          this.last_x = x;
          this.last_y = y;
          if (modified) {
            for (let column of column_modified) {
              this.checkColumn(column);
            }
            for (let row of row_modified) {
              this.checkRow(row);
            }
            this.repaint();
          }
        }
        if (this.row_lock === false && this.column_lock === false) {
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
      action_mode = ActionMode.NOT_DRAWING;
      this.row_lock = false;
      this.column_lock = false;

      this.renderer.setHighlightMode('hover');
      if (this.last_x !== undefined) {
        this.renderer.setHighlightColumn(this.last_x);
      }

      this.renderer.setHighlightMode('hover');
      if (this.last_y !== undefined) {
        this.renderer.setHighlightRow(this.last_y);
      }
    });
  }
}

new Play();