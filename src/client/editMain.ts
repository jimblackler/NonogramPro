import Alea from 'alea';
import axios from 'axios';
import {assertIs} from '../common/check/is';
import {assertNotNull} from '../common/check/null';
import {decode} from '../common/decoder';
import {encode} from '../common/encoder';
import {ClientGame, GameData} from '../common/gameData';
import {getEmpty} from '../common/generate';
import {generateClues} from '../common/generateClues';
import {getImageData, imageDataToGridData, loadFile} from '../common/importImage';
import {Spec} from '../common/spec';
import {bustCache} from './bustCache';
import {gamesDb} from './db/gamesDb';
import {getGame, getGameInternet} from './fetchGame';
import {plotLine} from './plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from './renderer';
import {transactionToPromise} from './transactionToPromise';
import {visualAnalyze} from './visualAnalyze';

let collection = '';
let data: boolean[][] = [];
let gameId = '';
let name = '';
let spec: Spec = {width: 0, height: 0};
let style: string | undefined;
let setStyle = '';
let lastX = -1;
let lastY = -1;

const title = assertIs(HTMLHeadingElement, document.body.querySelector('h1#title'));
const status = assertIs(HTMLElement, document.body.querySelector('#status'));
const createNew = assertNotNull(document.body.querySelector('#createNew'));
const play = assertNotNull(document.body.querySelector('#play'));
const analyze = assertNotNull(document.body.querySelector('#analyze'));
const importImageButton = assertNotNull(document.body.querySelector('#importImage'));
const publish = assertNotNull(document.body.querySelector('#publish'));
const cancel = assertNotNull(document.body.querySelector('#cancel'));
const delete_ = assertNotNull(document.body.querySelector('#delete'));
const gridSize = assertIs(HTMLSelectElement, document.body.querySelector('select#gridSize'));
const colorScheme = assertIs(HTMLSelectElement, document.body.querySelector('select#colorScheme'));

let needsPublish = false;

function setNeedsPublish(value: boolean) {
  if (needsPublish === value) {
    return;
  }
  needsPublish = value;
  if (value) {
    publish.removeAttribute('disabled');
    cancel.removeAttribute('disabled');
  } else {
    publish.setAttribute('disabled', '');
    cancel.setAttribute('disabled', '');
  }
}

title.setAttribute('contenteditable', 'true');

title.addEventListener('keypress', evt => {
  if (evt.keyCode === 10 || evt.keyCode === 13) {
    title.blur();
    evt.preventDefault();
  }
});

title.addEventListener('focus', () => {
  const range = document.createRange();
  range.selectNodeContents(title);
  const selection = window.getSelection();
  if (!selection) {
    throw new Error();
  }
  selection.removeAllRanges();
  selection.addRange(range);
});

title.addEventListener('blur', () => {
  const newName = title.textContent || '';
  if (name === newName) {
    return;
  }
  name = newName;
  setNeedsPublish(true);
  saveLocal().then(repaint);
});

status.innerText = 'Edit mode';

createNew.addEventListener('click', () => {
  window.location.href = 'edit';
});

play.addEventListener('click', () => {
  window.location.href = `/play?collection=${collection}&game=${gameId}`;
});

analyze.addEventListener('click', () => {
  const clues = generateClues(spec, data);
  visualAnalyze(spec, clues);
});

delete_.addEventListener('click', () => {
  delete_.setAttribute('disabled', '');
  const progress = addProgress();
  Promise.all([
    // Local delete.
    gamesDb
        .then(db => db.transaction('games', 'readwrite').objectStore('games').delete(gameId))
        .then(transactionToPromise),
    // Server delete.
    axios.post('/delete', {gameId})
  ]).then(() => {
    window.location.href = window.location.origin;
  }).finally(() => {
    progress.remove();
    delete_.removeAttribute('disabled');
  });
});

const DrawMode = {
  NOT_DRAWING: 0,
  SETTING: 1,
  DELETING: 2,
};

let drawMode = DrawMode.NOT_DRAWING;

const svg = document.getElementsByTagName('svg')[0];
const renderer = enhanceRenderer(svg);

function repaint() {
  const colorSchemeStylesheet =
      assertIs(HTMLLinkElement, document.getElementById('colorSchemeStylesheet'));
  title.textContent = name;
  renderer.paintOnSquares(data);
  const clues = generateClues(spec, data);
  renderer.paintClues(clues);

  gridSize.value = JSON.stringify(spec);

  colorScheme.value = style || 'midnight';

  if (setStyle !== style) {
    colorSchemeStylesheet.href = `/styles/color_schemes/${colorScheme.value}.css`;
    setStyle = colorScheme.value;
  }
}

function makeNewGame(spec_: Spec, replace: boolean) {
  const random = Alea();
  gameId = `default.draft${Math.floor(random() * 10000)}`;
  const url = `edit?game=${gameId}`;
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
  spec = spec_;
  style = 'midnight';
  data = getEmpty(spec);
  name = 'Untitled';
  renderer.setDimensions(spec);
  repaint();
}

gridSize.addEventListener('change', () => {
  spec = JSON.parse(gridSize.value);
  data = getEmpty(spec);
  renderer.setDimensions(spec);
  repaint();
});

colorScheme.addEventListener('change', () => {
  style = colorScheme.value || undefined;
  setNeedsPublish(true);
  repaint();
  saveLocal();
});

svg.addEventListener('griddown', evt => {
      const {x, y} = assertIs(CustomEvent, evt).detail as GridDownData;
      if (data[y][x]) {
        drawMode = DrawMode.DELETING;
        data[y][x] = false;
      } else {
        drawMode = DrawMode.SETTING;
        data[y][x] = true;
      }
      setNeedsPublish(true);
      lastX = x;
      lastY = y;
      repaint();
    }
);

svg.addEventListener('gridmove', evt => {
      const {x, y} = assertIs(CustomEvent, evt).detail as GridMoveData;
      if (drawMode === DrawMode.NOT_DRAWING) {
        return;
      }
      let modified = false;
      for (const p of plotLine(lastX, lastY, x, y)) {
        if (drawMode === DrawMode.SETTING) {
          if (!data[p.y][p.x]) {
            data[p.y][p.x] = true;
            modified = true;
          }
        } else if (drawMode === DrawMode.DELETING) {
          if (data[p.y][p.x]) {
            data[p.y][p.x] = false;
            modified = true;
          }
        }
      }
      lastX = x;
      lastY = y;
      if (modified) {
        setNeedsPublish(true);
        repaint();
      }
    }
);

function getGameFunction(game: GameData) {
  spec = game.spec;
  data = decode(spec, game.gridData);
  name = game.name;
  style = game.style;
  setNeedsPublish(game.needsPublish || false);
  renderer.setDimensions(spec);
  repaint();
}

cancel.addEventListener('click', evt => {
  // Defined as 'delete any local changes and restore to the published
  // version'.

  // We don't have a local copy so must refresh from server. Requires
  // internet. May not be the best solution.

  setNeedsPublish(false);
  const progress = addProgress();
  getGameInternet(gameId).then(getGameFunction)
      .catch(() => setNeedsPublish(true)).finally(() => progress.remove());
});

importImageButton.addEventListener('click', () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/svg+xml, image/png');
  input.click();
  loadFile(input).then(result => getImageData(result.type, result.data, document))
      .then(imageData => imageDataToGridData(imageData, spec))
      .then(data_ => {
        data = data_;
        setNeedsPublish(true);
        repaint();
      });
});

function addProgress() {
  const aside = document.body.getElementsByTagName('aside')[0];
  const progress = document.createElement('img');
  aside.append(progress);
  progress.setAttribute('src', '/images/progress.svg');
  progress.setAttribute('style', 'max-width: 4em');
  return progress;
}

publish.addEventListener('click', evt => {
  setNeedsPublish(false);
  const progress = addProgress();

  if (name === 'Untitled' || name === '') {
    name = prompt('Enter a name for your puzzle') || '';
    needsPublish = true;
    saveLocal().then(repaint);
  }
  const data_: ClientGame = {
    key: gameId,
    data: {
      gridData: encode(data),
      spec,
      name,
      style,
      needsPublish,
      difficulty: -1
    }
  };
  axios.post('/publish', data_).then(response => response.data)
      .then(obj => {
        if (obj.login) {
          setNeedsPublish(true);
          window.location.href = obj.login;
          return;
        }
        if (obj.exception) {
          alert(obj.exception);
          return;
        }
        const oldId = gameId;
        gameId = obj.game.key as string;
        bustCache(`/games?collection=${obj.game.collection}`)
            .then(() => gamesDb)
            .then(db => db.transaction('games', 'readwrite').objectStore('games').delete(oldId))
            .then(transactionToPromise)
            .then(() => window.history.replaceState({}, '', `edit?game=${gameId}`));

      })
      .catch(() => setNeedsPublish(true))
      .finally(() => progress.remove());
});

document.addEventListener('mouseup', evt => {
  drawMode = DrawMode.NOT_DRAWING;
  if (needsPublish) {
    saveLocal();
  }
});

gameId = new URL(window.location.href).searchParams.get('game') || '';
const defaultSpec = {width: 20, height: 20};

if (gameId) {
  getGame(gameId).then(getGameFunction).catch(() => makeNewGame(defaultSpec, true));
} else {
  // Otherwise make a new game.
  makeNewGame(defaultSpec, true);
}

function saveLocal() {
  const data_: GameData = {
    gridData: encode(data),
    spec,
    name,
    style,
    needsPublish,
    difficulty: -1
  };
  return gamesDb
      .then(db => db.transaction('games', 'readwrite').objectStore('games').put(data_, gameId))
      .then(transactionToPromise);
}
