import {Analyze} from './analyze';
import {Complete, completedDb} from './db/completedDb';
import {PlayInDb, playsDb} from './db/playsDb';
import {getGame} from './fetchGame';
import {Generate} from './generate';
import {generateClues} from './generateClues';
import {is} from './is';
import {notNull} from './notNull';
import {plotLine} from './plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from './renderer';
import {transactionToPromise} from './transactionToPromise';
import {truthy} from './truthy';

const gameId = new URL(window.location.href).searchParams.get('game') || '';

getGame(gameId).then(result => {
  if (typeof result.gridData !== 'object') {
    throw new Error();
  }
  const svg = truthy(document.getElementsByTagName('svg')[0]);
  const renderer = enhanceRenderer(svg);

  let rowLock: number | false = false;
  let columnLock: number | false = false;
  let lastX = -1;
  let lastY = -1;

  svg.addEventListener('griddown', evt => {
        const {x, y, which, shiftKey, ctrlKey} = is(CustomEvent, evt).detail as GridDownData;
        if (which === 3 || shiftKey) {
          // Right click.
          if (off[y][x]) {
            actionMode = ActionMode.SET_UNKNOWN;
            on[y][x] = false;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          } else {
            actionMode = ActionMode.SETTING_OFF;
            on[y][x] = false;
            off[y][x] = true;
            checkColumn(x);
            checkRow(y);
          }
        } else if (ctrlKey) {
          if (on[y][x]) {
            actionMode = ActionMode.SET_UNKNOWN;
            on[y][x] = false;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          } else {
            actionMode = ActionMode.SETTING_ON;
            on[y][x] = true;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          }
        } else {
          if (on[y][x]) {
            actionMode = ActionMode.SETTING_OFF;
            on[y][x] = false;
            off[y][x] = true;
            checkColumn(x);
            checkRow(y);
          } else if (off[y][x]) {
            actionMode = ActionMode.SET_UNKNOWN;
            on[y][x] = false;
            off[y][x] = false;
            checkColumn(x);
            checkRow(y);
          } else {
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
  );

  svg.addEventListener('gridmove', evt => {
        let {x, y} = is(CustomEvent, evt).detail as GridMoveData;
        if (actionMode !== ActionMode.NOT_DRAWING) {
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


  const spec = result.spec;
  const data = result.gridData;
  const style = result.style;
  let on = Generate.getEmpty(spec);
  let off = Generate.getEmpty(spec);
  renderer.setDimensions(spec);

  const colorSchemeStylesheet =
      is(HTMLLinkElement, document.getElementById('colorSchemeStylesheet'));
  colorSchemeStylesheet.href = `/styles/color_schemes/${style}.css`;

  const title = notNull(document.body.querySelector('#title'));
  title.textContent = result.name;
  const clues = generateClues(spec, data);
  renderer.paintClues(clues);
  playsDb
      .then(db => db.transaction('plays', 'readonly').objectStore('plays').get(gameId))
      .then(transactionToPromise)
      .then(result => result as PlayInDb | undefined)
      .then(data => {
        if (!data) {
          return;
        }
        on = data.on;
        off = data.off;
        fromScratch();
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
    playsDb.then(db => db.transaction('plays', 'readwrite').objectStore('plays')
        .put({on, off}, gameId));
    renderer.paintOnSquares(on);
    renderer.paintOffSquares(off); /* Check is complete */
    if (Generate.equals(on, data)) {
      svg.classList.add('gameComplete');
      const value: Complete = {completed: true};
      completedDb
          .then(db => db.transaction('completed', 'readwrite').objectStore('completed')
              .put(value, gameId))
          .then(transactionToPromise);
    } else {
      svg.classList.remove('gameComplete');
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
}, () => {
  alert('bad game');
});
