import {assertTruthy} from '../common/check/truthy';
import {isComplete, Round, solve} from '../common/solve';
import {Spec} from '../common/spec';
import {enhanceRenderer} from './renderer';

require('./dialog');

function draw(parent: HTMLElement, spec: Spec, on: boolean[][], priorOn: boolean[][],
              off: boolean[][], priorOff: boolean[][]) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  parent.append(svg);
  svg.classList.add('mini');

  const renderer = enhanceRenderer(svg);
  renderer.setDimensions(spec, {
    cellSize: 10,
    ratioForClues: 0,
    labelSize: 0,
    clueToGridMargin: 0,
    verticalClueSeparation: 0
  });
  renderer.paintOnSquares(on, priorOn);
  renderer.paintOffSquares(off, priorOff);
}

export function visualAnalyze(spec: Spec, clues: number[][][]) {
  const dialog = document.getElementById('dialog');
  if (!(dialog instanceof HTMLElement)) {
    throw new Error();
  }
  dialog.style.visibility = 'visible';
  const div = document.getElementById('dialog_content');

  if (!(div instanceof HTMLElement)) {
    throw new Error();
  }
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  const header = document.createElement('header');
  div.appendChild(header);

  let difficulty = 0;
  let lastRound: Round | undefined;
  for (const round of solve(spec, clues)) {
    draw(div, spec, round.on, round.priorOn, round.off, round.priorOff);
    difficulty++;
    lastRound = round;
  }

  let phrase;
  if (isComplete(spec, assertTruthy(lastRound))) {
    phrase = `Requires ${difficulty} rounds to complete with standard method.`;
  } else {
    phrase = 'Cannot be completed with standard method.';
  }
  const text = document.createTextNode(phrase);
  header.appendChild(text);

  div.style.width = div.offsetWidth + 'px';  // Fix width for dragging.
}
