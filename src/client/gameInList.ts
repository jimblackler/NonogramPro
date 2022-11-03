import {assertNotNull} from '../common/check/null';
import {decode} from '../common/decoder';
import {GameData} from '../common/gameData';

function addThumbnail(parent: HTMLElement, game: GameData) {
  const canvas = document.createElement('canvas');
  parent.append(canvas);
  const ctx = assertNotNull(canvas.getContext('2d'));
  const cellSize = Math.ceil(60 / game.spec.width);
  canvas.width = game.spec.width * cellSize;
  canvas.height = game.spec.height * cellSize;
  ctx.fillStyle = 'lightblue';
  let rowNumber = 0;
  for (const row of decode(game.spec, game.gridData)) {
    row.forEach((cell, columnNumber) => {
      if (cell) {
        ctx.fillRect(columnNumber * cellSize, rowNumber * cellSize, cellSize, cellSize);
      }
    });
    rowNumber++;
  }
  canvas.setAttribute('class', 'thumbnail');
}

export function addGame(list: HTMLElement, key: string, game: GameData, playing: boolean,
                        completed: boolean, full: boolean,
                        clickListener: (evt: MouseEvent) => void) {
  const li = document.createElement('li');
  list.append(li);

  li.addEventListener('click', clickListener);

  const anchor = document.createElement('a');
  li.append(anchor);
  anchor.setAttribute('href', `/play?game=${key}`);
  anchor.setAttribute('class',
      completed ? 'completed' : playing ? 'playing' : game.needsPublish ? 'draft' : 'unstarted');

  if (full) {
    addThumbnail(anchor, game);
  }

  const section = document.createElement('section');
  anchor.append(section);
  section.setAttribute('class', 'puzzleInfo');

  /* Name */
  {
    const name = document.createElement('span');
    section.append(name);
    name.setAttribute('class', 'name');
    name.append(game.name);
  }

  if (game.creatorScreenName) {
    const creator = document.createElement('span');
    section.append(creator);
    creator.setAttribute('class', 'creator');
    creator.append(`by ${game.creatorScreenName}`);
  }

  if (game.difficulty) {
    const name = document.createElement('span');
    section.append(name);
    name.setAttribute('class', 'difficulty');
    name.append(`Difficulty ${game.difficulty}`);
  }

  if (game.needsPublish) {
    const name = document.createElement('span');
    section.append(name);
    name.append('Draft');
  }

  /* Dimensions */
  {
    const dimensions = document.createElement('span');
    section.append(dimensions);
    dimensions.setAttribute('class', 'dimensions');
    dimensions.append(`${game.spec.width} x ${game.spec.height}`);
  }

  if (completed || playing) {
    const span = document.createElement('span');
    section.append(span);
    span.setAttribute('class', 'status');
    span.append(completed ? 'Completed' : 'In progress');
  }
}
