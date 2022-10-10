import Alea from 'alea';
import axios from 'axios';
import {Canvg, Parser} from 'canvg';
import {ClientGameData} from '../../common/clientGame';
import {Spec} from '../../common/spec';
import {Analyze} from '../analyze';
import {GamesDb} from '../db/gamesDb';
import {decode} from '../decoder';
import {encode} from '../encoder';
import {getGame} from '../fetchGame';
import {Generate} from '../generate';
import {generateClues} from '../generateClues';
import {is} from '../is';
import {notNull} from '../notNull';
import {plotLine} from '../plotLine';
import {enhanceRenderer, GridDownData, GridMoveData} from '../renderer';

function findLeftBounds(imageData: ImageData) {
  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return x;
      }
    }
  }
  return imageData.width;
}

function findRightBounds(imageData: ImageData) {
  for (let x = imageData.width - 1; x >= 0; x--) {
    for (let y = 0; y < imageData.height; y++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return x + 1;
      }
    }
  }
  return 0;
}

function findTopBounds(imageData: ImageData) {
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return y;
      }
    }
  }
  return imageData.height;
}

function findBottomBounds(imageData: ImageData) {
  for (let y = imageData.height - 1; y >= 0; y--) {
    for (let x = 0; x < imageData.width; x++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return y + 1;
      }
    }
  }
  return 0;
}

function findTrueBounds(ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  return {
    left: findLeftBounds(imageData), right: findRightBounds(imageData),
    top: findTopBounds(imageData), bottom: findBottomBounds(imageData)
  }
}

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

  const title = is(HTMLHeadingElement, section.querySelector('h1#title'));
  const status = is(HTMLElement, section.querySelector('section#status'));
  const createNew = notNull(section.querySelector('#createNew'));
  const play = notNull(section.querySelector('#play'));
  const analyze = notNull(section.querySelector('#analyze'));
  const importSvg = notNull(section.querySelector('#importSvg'));
  const publish = notNull(section.querySelector('#publish'));
  const cancel = notNull(section.querySelector('#cancel'));
  const delete_ = notNull(section.querySelector('#delete'));
  const gridSize = is(HTMLSelectElement, section.querySelector('select#gridSize'));
  const colorScheme = is(HTMLSelectElement, section.querySelector('select#colorScheme'));

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
    const clues = generateClues(spec, data);
    Analyze.visualAnalyze(spec, clues);
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

  importSvg.addEventListener('click', evt => {
    const input = document.createElement('input');
    section.append(input);
    input.setAttribute('id', 'importSvg');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/svg+xml');
    input.append('Import SVG');

    input.addEventListener('change', evt => {
      const file = input.files && input.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', evt => {
        const contents = reader.result;
        if (typeof contents !== 'string') {
          throw new Error();
        }
        const canvas = document.createElement('canvas');
        if (!canvas) {
          throw new Error();
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error();
        }

        const parser = new Parser({})
        parser.parse(contents).then(doc => {
          const canvg = new Canvg(ctx, doc, {});
          return canvg.render();
        }).then(() => {
          const trueBounds = findTrueBounds(ctx);
          const canvas2 = document.createElement('canvas');
          canvas2.width = spec.width;
          canvas2.height = spec.height;
          const ctx2 = canvas2.getContext('2d');
          if (!ctx2) {
            throw new Error();
          }
          const ratio = [spec.width / (trueBounds.right - trueBounds.left),
            spec.height / (trueBounds.bottom - trueBounds.top)];
          ctx2.scale(ratio[0], ratio[1]);
          ctx2.drawImage(canvas, -trueBounds.left, -trueBounds.top);

          section.append(canvas2);
          const imageData = ctx2.getImageData(0, 0, spec.width, spec.height);
          for (let y = 0; y < spec.height; y++) {
            for (let x = 0; x < spec.width; x++) {
              data[y][x] = imageData.data[(y * imageData.width + x) * 4 + 3] > 0;
            }
          }
          repaint();
        });
      });
      reader.readAsText(file);
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
}
