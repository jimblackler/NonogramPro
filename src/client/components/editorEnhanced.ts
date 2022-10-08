import Alea from 'alea';
import axios from 'axios';
import {ClientGameData} from '../../common/clientGame';
import {Spec} from '../../common/spec';
import {Analyze} from '../analyze';
import {GamesDb} from '../db/gamesDb';
import {decode} from '../decoder';
import {encode} from '../encoder';
import {getGame} from '../fetchGame';
import {Generate} from '../generate';
import {generateClues} from '../generateClues';
import {plotLine} from '../plotLine';
import {Renderer} from '../renderer';

export function editorEnhanced(section: HTMLElement) {
  let data: boolean[][] = [];
  let gameId = '';
  let name = '';
  let needsPublish = false;
  let spec: Spec = {width: 0, height: 0};
  let style = '';
  let setStyle = '';
  let lastX = -1;
  let lastY = -1;

  const gamesDb = new GamesDb();

  const title = section.querySelector('h1#title');
  const status = section.querySelector('section#status');
  const createNew = section.querySelector('#createNew');
  const play = section.querySelector('#play');
  const analyze = section.querySelector('#analyze');
  const publish = section.querySelector('#publish');
  const cancel = section.querySelector('#cancel');
  const delete_ = section.querySelector('#delete');
  const gridSize = section.querySelector('#gridSize');
  const colorScheme = section.querySelector('#ColorScheme');

  if (!(title instanceof HTMLHeadingElement) || !(status instanceof HTMLElement) || !createNew
      || !play || !analyze || !publish || !cancel || !delete_ || !gridSize || !colorScheme) {
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
    name = title.textContent || '';
    if (title.textContent === name) {
      title.textContent = name;
      needsPublish = true;
      saveLocal();
    }
  });

  status.innerText = 'Edit mode';

  createNew.addEventListener('click', evt => {
    window.location.href = 'edit';
  });
  play.addEventListener('click', evt => {
    window.location.href = `/play?game=${gameId}`;
  });

  analyze.addEventListener('click', evt => {
    let clues = generateClues(spec, data);
    Analyze.visualAnalyze(spec, clues);
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
    if (typeof data.grid_data !== 'object') {
      throw new Error();
    }
    data.grid_data = encode(data.grid_data);
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
            if (typeof game.grid_data != 'string') {
              throw new Error();
            }

            game.grid_data = decode(game.spec, game.grid_data);

            needsPublish = false;
            if (gameId !== newId) {
              gamesDb.deleteItem(gameId).then(
                  () => window.history.replaceState({}, '', `edit?game=${gameId}`));
              gameId = newId;
            }
            gamesDb.set(gameId, game);
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
    getGame(gamesDb, gameId, game => {
      if (typeof game.grid_data !== 'object') {
        throw new Error();
      }
      spec = game.spec;
      data = game.grid_data;
      name = game.name;
      repaint();
    }, () => {
    });
  });

  delete_.addEventListener('click', evt => {
    // Local delete
    gamesDb.deleteItem(gameId);
    // Remove delete
    axios.post('/delete', {game_id: gameId})
        .then(response => response.data)
        .then(obj => {
          window.location.href = window.location.origin;
        });
  });

  gridSize.addEventListener('change', evt => {
    const target = evt.target;
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error();
    }
    spec = JSON.parse(target.value);
    data = Generate.getEmpty(spec);
    renderer.setDimensions(spec);
    repaint();
  });

  colorScheme.addEventListener('change', evt => {
    const target = evt.target;
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error();
    }
    style = target.value;
    needsPublish = true;
    repaint();
    saveLocal();
  });

  const DrawMode = {
    NOT_DRAWING: 0,
    SETTING: 1,
    DELETING: 2,
  };

  let drawMode = DrawMode.NOT_DRAWING;

  const svg = document.getElementsByTagName('svg')[0];
  const renderer: Renderer = new Renderer(svg);
  svg.addEventListener('contextmenu', evt => {
    evt.preventDefault();
  });
  svg.addEventListener('mousedown', evt => {
    if (!renderer) {
      throw new Error();
    }
    renderer.mousedown(evt, (renderer, x, y, which) => {
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
    });
  });

  svg.addEventListener('mousemove', evt => {
    if (!renderer) {
      return;
    }
    renderer.mousemove(evt, (renderer, x, y) => {
      if (drawMode === DrawMode.NOT_DRAWING) {
        return;
      }
      let modified = false;
      if (x >= 0 && x < spec.width && y >= 0 && y < spec.height) {
        for (let p of plotLine(lastX, lastY, x, y)) {
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
        gamesDb, gameId,
        game => {
          spec = game.spec;
          if (typeof game.grid_data !== 'object') {
            throw new Error();
          }
          data = game.grid_data;
          name = game.name;
          style = game.style;
          needsPublish = game.needs_publish || false;
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
      grid_data: data as string | boolean[][],
      spec: spec,
      name: name,
      style: style,
    };
  }

  function saveLocal() {
    const data1 = getData();
    if (typeof data1.grid_data === 'string') {
      throw new Error();
    }
    const data: ClientGameData = {
      ...data1,
      needs_publish: needsPublish,
      difficulty: Analyze.analyze(spec, generateClues(spec, data1.grid_data), () => {
      })
    };
    gamesDb.set(gameId, data);
  }

  function repaint() {
    const title = document.getElementById('title');
    const gridSize = document.getElementById('gridSize');
    const colorScheme = document.getElementById('ColorScheme');
    const publish = document.getElementById('publish');
    const colorSchemeStylesheet = document.getElementById('colorSchemeStylesheet');

    if (!title || !(gridSize instanceof HTMLSelectElement) ||
        !(colorScheme instanceof HTMLSelectElement) || !renderer || !publish ||
        !(colorSchemeStylesheet instanceof HTMLLinkElement)) {
      throw new Error();
    }
    title.textContent = name;
    renderer.paintOnSquares(data);
    let clues = generateClues(spec, data);
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
}
