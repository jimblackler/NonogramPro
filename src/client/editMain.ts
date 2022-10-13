import Alea from 'alea';
import axios from 'axios';
import {ClientGameData} from '../common/clientGame';
import {Spec} from '../common/spec';
import {Analyze} from './analyze';
import {gamesDb} from './db/gamesDb';
import {decode} from './decoder';
import {encode} from './encoder';
import {getGame} from './fetchGame';
import {Generate} from './generate';
import {generateClues} from './generateClues';
import {importImage} from './importImage';
import {is} from './is';
import {notNull} from './notNull';
import {plotLine} from './plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from './renderer';
import {transactionToPromise} from './transactionToPromise';

let data: boolean[][] = [];
let gameId = '';
let name = '';
let needsPublish = false;
let spec: Spec = {width: 0, height: 0};
let style = '';
let setStyle = '';
let lastX = -1;
let lastY = -1;

const title = is(HTMLHeadingElement, document.body.querySelector('h1#title'));
const status = is(HTMLElement, document.body.querySelector('#status'));
const createNew = notNull(document.body.querySelector('#createNew'));
const play = notNull(document.body.querySelector('#play'));
const analyze = notNull(document.body.querySelector('#analyze'));
const importImageButton = notNull(document.body.querySelector('#importImage'));
const publish = notNull(document.body.querySelector('#publish'));
const cancel = notNull(document.body.querySelector('#cancel'));
const delete_ = notNull(document.body.querySelector('#delete'));
const gridSize = is(HTMLSelectElement, document.body.querySelector('select#gridSize'));
const colorScheme = is(HTMLSelectElement, document.body.querySelector('select#colorScheme'));

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

title.addEventListener('blur', evt => {
  name = title.textContent || '';
  if (title.textContent === name) {
    title.textContent = name;
    needsPublish = true;
    saveLocal();
  }
});

status.innerText = 'Edit mode';

createNew.addEventListener('click', () => {
  window.location.href = 'edit';
});
play.addEventListener('click', () => {
  window.location.href = `/play?game=${gameId}`;
});

analyze.addEventListener('click', () => {
  const clues = generateClues(spec, data);
  Analyze.visualAnalyze(spec, clues);
});

delete_.addEventListener('click', () => {
  // Local delete
  gamesDb
      .then(db => db.transaction('games', 'readwrite').objectStore('games').delete(gameId))
      .then(transactionToPromise);
  // Remove delete
  axios.post('/delete', {game_id: gameId})
      .then(response => response.data)
      .then(obj => {
        window.location.href = window.location.origin;
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
      is(HTMLLinkElement, document.getElementById('colorSchemeStylesheet'));
  title.textContent = name;
  renderer.paintOnSquares(data);
  const clues = generateClues(spec, data);
  renderer.paintClues(clues);

  gridSize.value = `{"width": ${spec.width}, "height": ${spec.height}}`;

  colorScheme.value = style;

  if (needsPublish) {
    publish.removeAttribute('disabled');
  } else {
    publish.setAttribute('disabled', '');
  }
  if (setStyle !== style) {
    colorSchemeStylesheet.href = `/styles/color_schemes/${style}.css`;
    setStyle = style;
  }
}

function makeNewGame(spec_: Spec, replace: boolean) {
  const random = Alea();
  gameId = `draft${random() * 10000 | 0}`;
  const url = `edit?game=${gameId}`;
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
  spec = spec_;
  style = 'midnight';
  data = Generate.getEmpty(spec);
  name = 'Untitled';
  renderer.setDimensions(spec);
  repaint();
}

gridSize.addEventListener('change', evt => {
  spec = JSON.parse(gridSize.value);
  data = Generate.getEmpty(spec);
  renderer.setDimensions(spec);
  repaint();
});

colorScheme.addEventListener('change', evt => {
  style = colorScheme.value;
  needsPublish = true;
  repaint();
  saveLocal();
});

svg.addEventListener('griddown', evt => {
      const {x, y} = is(CustomEvent, evt).detail as GridDownData;
      if (x >= 0 && x < spec.width && y >= 0 && y < spec.height) {
        if (data[y][x]) {
          drawMode = DrawMode.DELETING;
          data[y][x] = false;
          needsPublish = true;
        } else {
          drawMode = DrawMode.SETTING;
          data[y][x] = true;
          needsPublish = true;
        }
        lastX = x;
        lastY = y;
        repaint();
      }
    }
);

svg.addEventListener('gridmove', evt => {
      const {x, y} = is(CustomEvent, evt).detail as GridMoveData;
      if (drawMode === DrawMode.NOT_DRAWING) {
        return;
      }
      let modified = false;
      if (x >= 0 && x < spec.width && y >= 0 && y < spec.height) {
        for (const p of plotLine(lastX, lastY, x, y)) {
          if (drawMode === DrawMode.SETTING) {
            if (!data[p.y][p.x]) {
              data[p.y][p.x] = true;
              modified = true;
              needsPublish = true;
            }
          } else if (drawMode === DrawMode.DELETING) {
            if (data[p.y][p.x]) {
              data[p.y][p.x] = false;
              modified = true;
              needsPublish = true;
            }
          }
        }
        lastX = x;
        lastY = y;
        if (modified) {
          repaint();
        }
      }
    }
);

cancel.addEventListener('click', evt => {
  // Defined as 'delete any local changes and restore to the published
  // version'.

  // We don't have a local copy so must refresh from server. Requires
  // internet. May not be the best solution.
  getGame(gameId, game => {
    if (typeof game.gridData !== 'object') {
      throw new Error();
    }
    spec = game.spec;
    data = game.gridData;
    name = game.name;
    repaint();
  }, () => {
  });
});

importImageButton.addEventListener('click', () => {
  importImage(spec, data).then(() => {
    needsPublish = true;
    repaint();
  });
});

publish.addEventListener('click', evt => {
  if (name === 'Untitled' || name === '') {
    name = prompt('Enter a name for your puzzle') || '';
    saveLocal();
    repaint();
  }
  const data = {
    ...getData(),
    game_id: gameId
  };
  // We don't technically need to uuencode the grid at this stage, but
  // big boolean arrays aren't transport or server friendly.
  if (typeof data.gridData !== 'object') {
    throw new Error();
  }
  data.gridData = encode(data.gridData);
  axios.post('/publish', data)
      .then(response => response.data)
      .then(obj => {
        if (obj.login) {
          window.location.href = obj.login;
        } else if (obj.exception) {
          alert(obj.exception);
        } else {
          const game = obj.game.data;
          const newId = obj.game.key;
          if (typeof game.gridData != 'string') {
            throw new Error();
          }

          game.gridData = decode(game.spec, game.gridData);

          needsPublish = false;
          if (gameId !== newId) {
            gamesDb
                .then(db => db.transaction('games', 'readwrite').objectStore('games').delete(gameId))
                .then(transactionToPromise).then(
                () => window.history.replaceState({}, '', `edit?game=${gameId}`));
            gameId = newId;
          }
          gamesDb
              .then(db => db.transaction('games', 'readwrite').objectStore('games').put(game, gameId))
              .then(transactionToPromise);
          publish.setAttribute('disabled', '');

          alert(`Difficulty ${game.difficulty}`);
        }
      });
});

document.addEventListener('mouseup', evt => {
  drawMode = DrawMode.NOT_DRAWING;
  if (needsPublish) {
    saveLocal();
  }
});

gameId = new URL(window.location.href).searchParams.get('game') || '';
needsPublish = false;
const defaultSpec = {width: 20, height: 20};

if (gameId) {
  getGame(
      gameId,
      game => {
        spec = game.spec;
        if (typeof game.gridData !== 'object') {
          throw new Error();
        }
        data = game.gridData;
        name = game.name;
        style = game.style;
        needsPublish = game.needsPublish || false;
        renderer.setDimensions(spec);
        repaint();
      },
      () => {
        makeNewGame(defaultSpec, true);
      });
} else {
  // Otherwise make a new game.
  makeNewGame(defaultSpec, true);
}

function getData() {
  return {
    gridData: data as string | boolean[][],
    spec: spec,
    name: name,
    style: style,
  };
}

function saveLocal() {
  const data1 = getData();
  if (typeof data1.gridData === 'string') {
    throw new Error();
  }
  let difficulty = 0;
  for (const round of Analyze.analyze(spec, generateClues(spec, data1.gridData))) {
    difficulty++;
  }
  const data: ClientGameData = {
    ...data1,
    needsPublish,
    difficulty
  };
  gamesDb
      .then(db => db.transaction('games', 'readwrite').objectStore('games').put(data, gameId))
      .then(transactionToPromise);
}
