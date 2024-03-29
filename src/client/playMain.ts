import {assertIs} from '../common/check/is';
import {assertNotNull} from '../common/check/null';
import {assertTruthy} from '../common/check/truthy';
import {decode} from '../common/decoder';
import {equals, getEmpty} from '../common/generate';
import {generateClues} from '../common/generateClues';
import {checkColumn, checkRow, findHint} from './analyze';
import {Complete, completedDb} from './db/completedDb';
import {PlayInDb, playsDb} from './db/playsDb';
import {getGame} from './fetchGame';
import './globals';
import {plotLine} from './plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from './renderer';
import {transactionToPromise} from './transactionToPromise';

const gameId = new URL(window.location.href).searchParams.get('game') || '';

function getDrawModeRadio() {
  return assertIs(HTMLInputElement, document.querySelector('input[name="mode"]:checked')).value;
}

function setDrawModeRadio(mode: string) {
  if (!mode) {
    throw new Error();
  }
  for (const element of document.querySelectorAll('input[name="mode"]')) {
    const input = assertIs(HTMLInputElement, element);
    input.checked = input.value === mode;
  }
}

getGame(gameId).then(result => {
  const svg = assertTruthy(document.getElementsByTagName('svg')[0]);
  const renderer = enhanceRenderer(svg);

  let rowLock: number | false = false;
  let columnLock: number | false = false;
  let lastX = -1;
  let lastY = -1;

  let preDrawMode = '';
  let preShiftMode = '';
  let preCtrlMode = '';

  function setPoints(points: Iterable<{ x: number, y: number }>) {
    const columnModified = new Set<number>();
    const rowModified = new Set<number>();
    let modified = false;

    const actionMode = getDrawModeRadio();

    for (const p of points) {
      if (actionMode === 'On') {
        if (!on[p.y][p.x]) {
          on[p.y][p.x] = true;
          off[p.y][p.x] = false;
          modified = true;
          columnModified.add(p.x);
          rowModified.add(p.y);
        }
      } else if (actionMode === 'Off') {
        if (!off[p.y][p.x]) {
          on[p.y][p.x] = false;
          off[p.y][p.x] = true;
          modified = true;
          columnModified.add(p.x);
          rowModified.add(p.y);
        }
      } else if (actionMode === 'Unknown') {
        if (on[p.y][p.x] || off[p.y][p.x]) {
          on[p.y][p.x] = false;
          off[p.y][p.x] = false;
          modified = true;
          columnModified.add(p.x);
          rowModified.add(p.y);
        }
      }
      lastX = p.x;
      lastY = p.y;
    }

    if (modified) {
      for (const column of columnModified) {
        checkColumn_(column);
      }
      for (const row of rowModified) {
        checkRow_(row);
      }
      repaint();
    }
  }

  svg.addEventListener('griddown', evt => {
        const {x, y, which} = assertIs(CustomEvent, evt).detail as GridDownData;
        preDrawMode = getDrawModeRadio();

        if (preDrawMode === 'Auto') {
          if (which === 3) {
            // Right click.
            if (off[y][x]) {
              setDrawModeRadio('Unknown');
            } else {
              setDrawModeRadio('Off');
            }
          } else {
            if (on[y][x]) {
              setDrawModeRadio('Off');
            } else if (off[y][x]) {
              setDrawModeRadio('Unknown');
            } else {
              setDrawModeRadio('On');
            }
          }
        }
        setPoints([{x, y}]);
      }
  );

  svg.addEventListener('gridmove', evt => {
        let {x, y} = assertIs(CustomEvent, evt).detail as GridMoveData;
        if (preDrawMode) {
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

          setPoints(plotLine(lastX, lastY, x, y));
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

  document.addEventListener('keydown', evt => {
    if (!evt.repeat) {
      const mode = getDrawModeRadio();
      if (evt.shiftKey) {
        preShiftMode = mode;
        setDrawModeRadio('On');
      }

      if (evt.ctrlKey) {
        preCtrlMode = mode;
        setDrawModeRadio('Off');
      }
    }
    evt.preventDefault();
  });

  document.addEventListener('keyup', evt => {
    if (preShiftMode && !evt.shiftKey) {
      setDrawModeRadio(preShiftMode);
      preShiftMode = '';
    }

    if (preCtrlMode && !evt.ctrlKey) {
      setDrawModeRadio(preCtrlMode);
      preCtrlMode = '';
    }
    evt.preventDefault();
  });

  svg.addEventListener('mouseout', () => {
    renderer.setHighlightColumn(-1);
    renderer.setHighlightRow(-1);
  });

  const spec = result.spec;
  const data = [...decode(spec, result.gridData)];
  const style = result.style || 'midnight';
  let on = getEmpty(spec);
  let off = getEmpty(spec);
  renderer.setDimensions(spec);

  const colorSchemeStylesheet =
      assertIs(HTMLLinkElement, document.getElementById('colorSchemeStylesheet'));
  colorSchemeStylesheet.href = `/styles/color_schemes/${style}.css`;

  const title = assertNotNull(document.body.querySelector('#title'));
  title.textContent = result.name;

  const license = assertIs(HTMLAnchorElement, document.querySelector('a#license'));
  if (result.license) {
    license.setAttribute('href', result.license);
    license.style.display = 'inherit';
  } else {
    license.style.display = 'none';
  }

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
        if (data.on.length === spec.height &&
            data.on.every(row => row.length === spec.width) &&
            data.off.length === spec.height &&
            data.off.every(row => row.length === spec.width)) {
          on = data.on;
          off = data.off;
        }
        fromScratch();
      });

  const replay = assertNotNull(document.body.querySelector('#replay'));
  const edit = assertIs(HTMLButtonElement, document.body.querySelector('#edit'));
  edit.style.visibility = result.creatorScreenName
  && clientPageData.screenName === result.creatorScreenName
  || clientPageData.isAdmin ? 'visible' : 'hidden';

  const hint = assertNotNull(document.body.querySelector('#hint'));

  replay.addEventListener('click', () => {
    on = getEmpty(spec);
    off = getEmpty(spec);
    fromScratch();

    completedDb
        .then(db => db.transaction('completed', 'readwrite').objectStore('completed')
            .delete(gameId))
        .then(transactionToPromise);
  });

  edit.addEventListener('click', () => {
    window.location.href = `edit?game=${gameId}`;
  });

  hint.addEventListener('click', () => {
    renderer.setHighlightMode('hint');
    const hint = findHint(spec, clues, on, off);
    renderer.setHighlightRow(hint[0]);
    renderer.setHighlightColumn(hint[1]);
  });

  document.addEventListener('mouseup', evt => {
    setDrawModeRadio(preDrawMode);
    preDrawMode = '';
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

  function checkColumn_(column: number) {
    const clue = clues[1][column];
    const complete = clue.map(c => -1);
    const valid = checkColumn(spec, on, off, column, clue, complete);
    renderer.setColumnValid(column, valid, complete);
  }

  function checkRow_(row: number) {
    const clue = clues[0][row];
    const complete = clue.map(c => -1);
    const valid = checkRow(spec, on, off, row, clue, complete);
    renderer.setRowValid(row, valid, complete);
  }

  function repaint() {
    playsDb.then(db => db.transaction('plays', 'readwrite').objectStore('plays')
        .put({on, off}, gameId));
    renderer.paintOnSquares(on);
    renderer.paintOffSquares(off); /* Check is complete */
    if (equals(on, data)) {
      document.body.classList.add('gameComplete');
      const value: Complete = {completed: true};
      completedDb
          .then(db => db.transaction('completed', 'readwrite').objectStore('completed')
              .put(value, gameId))
          .then(transactionToPromise);
    } else {
      document.body.classList.remove('gameComplete');
    }
  }

  function fromScratch() {
    for (let column = 0; column !== spec.width; column++) {
      checkColumn_(column);
    }
    for (let row = 0; row !== spec.height; row++) {
      checkRow_(row);
    }
    repaint();
  }
}).catch(err => {
  alert(err);
});
