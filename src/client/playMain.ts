import {Spec} from '../common/spec';
import {Analyze} from './analyze';
import {CompletedDb} from './db/completedDb';
import {GamesDb} from './db/gamesDb';
import {PlaysDb} from './db/playsDb';
import {getGame} from './fetchGame';
import {Generate} from './generate';
import {generateClues} from './generateClues';
import {is} from './is';
import {notNull} from './notNull';
import {plotLine} from './plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from './renderer';
import {truthy} from './truthy';

let rowLock: number | false = false;
let columnLock: number | false = false;
let spec: Spec = {width: 0, height: 0};
let clues: number[][][] = [];
let data: boolean[][] = [];
let style = '';
let on: boolean[][] = [];
let off: boolean[][] = [];
let lastX = -1;
let lastY = -1;
const gamesDb = new GamesDb();
const playsDb = new PlaysDb();
const completedDb = new CompletedDb();
rowLock = false;
columnLock = false;

const gameId = new URL(window.location.href).searchParams.get('game') || '';
const svg = truthy(document.getElementsByTagName('svg')[0]);

const renderer = enhanceRenderer(svg);
svg.addEventListener('griddown', evt => {
      const {x, y, which, shiftKey} = is(CustomEvent, evt).detail as GridDownData;
      if (x >= 0 && x < spec.width && y >= 0 && y < spec.height) {
        if (which === 3 || shiftKey) {
          // Right click.
          if (off[y][x]) {
            actionMode = ActionMode.SET_UNKNOWN;
            on[y][x] = false;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          } else if (!off[y][x]) {
            actionMode = ActionMode.SETTING_OFF;
            on[y][x] = false;
            off[y][x] = true;
            checkColumn(x);
            checkRow(y);
          }
        } else {
          if (on[y][x]) {
            actionMode = ActionMode.SET_UNKNOWN;
            on[y][x] = false;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          } else if (!on[y][x]) {
            actionMode = ActionMode.SETTING_ON;
            on[y][x] = true;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          }
        }
        lastX = x;
        lastY = y;
        repaint()
      }
    }
);

svg.addEventListener('gridmove', evt => {
      let {x, y} = is(CustomEvent, evt).detail as GridMoveData;
      if (actionMode !== ActionMode.NOT_DRAWING &&
          x >= 0 && x < spec.width && y >= 0 && y < spec.height) {
        if (rowLock === false && columnLock === false) {
          if (lastY !== y) {
            columnLock = x;
            renderer.setHighlightMode('locked');
            renderer.setHighlightColumn(x);
            renderer.setHighlightRow(-1);
          } else if (lastX !== x) {
            rowLock = y;
            renderer.setHighlightMode('locked');
            renderer.setHighlightColumn(-1);
            renderer.setHighlightRow(y);
          }
        }

        if (columnLock !== false) {
          x = columnLock;
        } else if (rowLock !== false) {
          y = rowLock;
        }

        const columnModified = new Set<number>();
        const rowModified = new Set<number>();
        let modified = false;
        for (const p of plotLine(lastX, lastY, x, y)) {
          if (actionMode === ActionMode.SETTING_ON) {
            if (!on[p.y][p.x]) {
              on[p.y][p.x] = true;
              off[p.y][p.x] = false;
              modified = true;
              columnModified.add(p.x);
              rowModified.add(p.y);
            }
          } else if (actionMode === ActionMode.SETTING_OFF) {
            if (!off[p.y][p.x]) {
              on[p.y][p.x] = false;
              off[p.y][p.x] = true;
              modified = true;
              columnModified.add(p.x);
              rowModified.add(p.y);
            }
          } else if (actionMode === ActionMode.SET_UNKNOWN) {
            if (on[p.y][p.x] || off[p.y][p.x]) {
              on[p.y][p.x] = false;
              off[p.y][p.x] = false;
              modified = true;
              columnModified.add(p.x);
              rowModified.add(p.y);
            }
          }
        }

        lastX = x;
        lastY = y;
        if (modified) {
          for (const column of columnModified) {
            checkColumn(column);
          }
          for (const row of rowModified) {
            checkRow(row);
          }
          repaint();
        }
      }

      if (rowLock === false && columnLock === false) {
        if (x >= 0 && x < spec.width) {
          renderer.setHighlightMode('hover');
          renderer.setHighlightColumn(x);
        }
        if (y >= 0 && y < spec.height) {
          renderer.setHighlightMode('hover');
          renderer.setHighlightRow(y);
        }
      }
    }
);

svg.addEventListener('mouseout', evt => {
  renderer.setHighlightColumn(-1);
  renderer.setHighlightRow(-1);
});

getGame(gamesDb, gameId, result => {
  if (typeof result.grid_data !== 'object') {
    throw new Error();
  }

  spec = result.spec;
  data = result.grid_data;
  style = result.style;
  on = Generate.getEmpty(spec);
  off = Generate.getEmpty(spec);
  renderer.setDimensions(spec);

  const colorSchemeStylesheet =
      is(HTMLLinkElement, document.getElementById('colorSchemeStylesheet'));
  colorSchemeStylesheet.href = `/styles/color_schemes/${style}.css`;

  const title = notNull(document.body.querySelector('#title'));
  title.textContent = result.name;
  clues = generateClues(spec, data);
  renderer.paintClues(clues);
  playsDb.get(gameId).then(data => {
    if (!data) {
      return;
    }
    on = data.on;
    off = data.off;
    fromScratch();
  });
}, () => {
  alert('bad game');
});

const replay = notNull(document.body.querySelector('#replay'));
const edit = notNull(document.body.querySelector('#edit'));
const hint = notNull(document.body.querySelector('#hint'));

replay.addEventListener('click', () => {
  on = Generate.getEmpty(spec);
  off = Generate.getEmpty(spec);
  fromScratch();
});

edit.addEventListener('click', () => {
  window.location.href = `edit?game=${gameId}`;
});

hint.addEventListener('click', () => {
  renderer.setHighlightMode('hint');
  const hint = Analyze.findHint(spec, clues, on, off);
  renderer.setHighlightRow(hint[0]);
  renderer.setHighlightColumn(hint[1]);
});

const ActionMode = {NOT_DRAWING: 0, SETTING_ON: 1, SETTING_OFF: 2, SET_UNKNOWN: 3,};
let actionMode = ActionMode.NOT_DRAWING;

document.addEventListener('mouseup', evt => {
  actionMode = ActionMode.NOT_DRAWING;
  rowLock = false;
  columnLock = false;
  renderer.setHighlightMode('hover');
  if (lastX !== -1) {
    renderer.setHighlightColumn(lastX);
  }
  renderer.setHighlightMode('hover');
  if (lastY !== -1) {
    renderer.setHighlightRow(lastY);
  }
});

function checkColumn(column: number) {
  const clue = clues[1][column];
  const complete = [];
  while (complete.length < clue.length) {
    complete.push(-1);
  }
  const valid = Analyze.checkColumn(spec, on, off, column, clue, complete);
  renderer.setColumnValid(column, valid, complete);
}

function checkRow(row: number) {
  const clue = clues[0][row];
  const complete = [];
  while (complete.length < clue.length) {
    complete.push(-1);
  }
  const valid = Analyze.checkRow(spec, on, off, row, clue, complete);
  renderer.setRowValid(row, valid, complete);
}

function repaint() {
  playsDb.set(gameId, {on: on, off: off});
  renderer.paintOnSquares(on);
  renderer.paintOffSquares(off); /* Check is complete */
  if (Generate.equals(on, data)) {
    svg.classList.add('game_complete');
    completedDb.set(gameId, {});
  } else {
    svg.classList.remove('game_complete');
  }
}

function fromScratch() {
  for (let column = 0; column !== spec.width; column++) {
    checkColumn(column);
  }
  for (let row = 0; row !== spec.height; row++) {
    checkRow(row);
  }
  repaint();
}
