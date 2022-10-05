import {Spec} from '../common/spec';
import {Generate} from './generate';
import {Renderer} from './renderer';

require('./dialog');

function analyzeSequence(
    clue: number[], clueIdx: number, on: boolean[][], off: boolean[][], start: number,
    maxStart: number, uSize: number, v: number, horizontal: boolean, inferOn: boolean[] | undefined,
    inferOff: boolean[] | undefined, complete?: number[]) {
  if (clueIdx === clue.length) {
    /* We have a viable combination provided no 'on' blocks remain. */
    for (let u = start; u < uSize; u++) {
      if (horizontal ? on[v][u] : on[u][v]) {
        return false;
      }
    }
    /* We have end of a viable combination. */
    if (inferOn) {
      for (let u = start; u < uSize; u++) {
        inferOn[u] = false;
      }
    }
    return true;
  }

  let viable = false;
  const block_length = clue[clueIdx];
  let run_length = 0;
  let stop_scan = maxStart + block_length;
  for (let u = start; u < stop_scan; u++) {
    if (horizontal ? off[v][u] : off[u][v]) {
      run_length = 0;
      continue;
    }
    if (horizontal ? on[v][u] : on[u][v]) {
      if (u + block_length < stop_scan) {
        stop_scan = u + block_length;
      }
    }

    run_length += 1;
    if (run_length < block_length) {
      // Block not long enough.
      continue;
    }
    if (u + 1 < uSize && (horizontal ? on[v][u + 1] : on[u + 1][v])) {
      // No spacer.
      continue;
    }
    if (!analyzeSequence(
        clue, clueIdx + 1, on, off, u + 2, maxStart + block_length + 1,
        uSize, v, horizontal, inferOn, inferOff, complete)) {
      // No solutions for the rest of the sequence.
      continue;
    }

    viable = true;

    const block_start = u - block_length + 1;
    if (complete) {
      let filled = true;
      for (let u0 = block_start; u0 <= u && filled; u0++) {
        if (horizontal ? !on[v][u0] : !on[u0][v]) {
          filled = false;
        }
      }
      if (!filled) {
        complete[clueIdx] = -3;
      } else if (complete[clueIdx] === -1) {
        complete[clueIdx] = block_start;
      } else if (complete[clueIdx] !== block_start) {
        complete[clueIdx] = -2;
      }
    }
    if (!inferOn) {
      continue;
    }

    if (!inferOff) {
      throw new Error();
    }

    if (u + 1 < uSize) {
      inferOn[u + 1] = false;
    }
    let u0 = u;
    while (u0 >= block_start) {
      inferOff[u0] = false;
      u0--;
    }
    while (u0 >= start) {
      inferOn[u0] = false;
      u0--;
    }
  }
  return viable;
}

function analyzeLine(
    clue: number[], on: boolean[][], off: boolean[][], v: number, uSize: number,
    horizontal: boolean, inferOn: boolean[] | undefined, inferOff: boolean[] | undefined,
    complete?: number[]) {
  let max_start = uSize;
  let spacer = 0;
  for (let idx = 0; idx < clue.length; idx++) {
    max_start -= clue[idx];
    max_start -= spacer;
    spacer = 1;
  }

  return analyzeSequence(
      clue, 0, on, off, 0, max_start, uSize, v, horizontal, inferOn,
      inferOff, complete);
}

function analyzePass(
    spec: Spec, clues: number[][][], on: boolean[][], off: boolean[][], horizontal: boolean) {
  const u_size = horizontal ? spec.width : spec.height;
  const v_size = horizontal ? spec.height : spec.width;
  for (let v = 0; v < v_size; v++) {
    const infer_on = [];
    const infer_off = [];
    for (let u = 0; u < u_size; u++) {
      infer_on.push(true);
      infer_off.push(true);
    }
    analyzeLine(
        clues[horizontal ? 0 : 1][v], on, off, v, u_size, horizontal, infer_on,
        infer_off);
    for (let u = 0; u < u_size; u++) {
      if (infer_on[u]) {
        console.assert(!infer_off[u]);
        if (horizontal) {
          on[v][u] = true;
        } else {
          on[u][v] = true;
        }
      } else if (infer_off[u]) {
        if (horizontal) {
          off[v][u] = true;
        } else {
          off[u][v] = true;
        }
      }
    }
  }
}

function draw(
    spec: Spec, on: boolean[][], priorOn: boolean[][], off: boolean[][], priorOff: boolean[][]) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('mini');
  const renderer = new Renderer(svg, spec, {cell_size: 10, ratio_for_clues: 0});
  renderer.paintOnSquares(on, priorOn);
  renderer.paintOffSquares(off, priorOff);
  return svg;
}

export class Analyze {
  static analyze(spec: Spec, clues: number[][][],
                 per_round: (on: boolean[][], priorOn: boolean[][], off: boolean[][],
                             priorOff: boolean[][]) => void) {
    const on = Generate.getEmpty(spec);
    const off = Generate.getEmpty(spec);
    let failed = 0;
    let horizontal = true;
    let rounds = 0;

    while (true) {
      const priorOn = Generate.clone(on);
      const priorOff = Generate.clone(off);
      analyzePass(spec, clues, on, off, horizontal);
      if (Generate.equals(on, priorOn) && Generate.equals(off, priorOff)) {
        failed++;
        if (failed === 2) {
          return -1;
        }
      } else {
        failed = 0;
      }
      per_round(on, priorOn, off, priorOff);

      if (Generate.complete(on, off)) {
        return rounds;
      }

      horizontal = !horizontal;
      rounds++;
    }
  }

  static visualAnalyze(spec: Spec, clues: number[][][]) {
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

    let difficulty = Analyze.analyze(
        spec, clues,
        (on, priorOn, off, priorOff) =>
            div.appendChild(draw(spec, on, priorOn, off, priorOff)));

    let phrase;
    if (difficulty === -1) {
      phrase = 'Cannot be completed with standard method.';
    } else {
      phrase =
          `Requires ${difficulty} rounds to complete with standard method.`;
    }
    const text = document.createTextNode(phrase);
    header.appendChild(text);

    div.style.width = div.offsetWidth + 'px';  // Fix width for dragging.
  }

  static checkRow(spec: Spec, on: boolean[][], off: boolean[][], row: number, clue: number[], complete: number[]) {
    return analyzeLine(
        clue, on, off, row, spec.height, true, undefined, undefined, complete);
  }

  static checkColumn(spec: Spec, on: boolean[][], off: boolean[][], column: number, clue: number[], complete: number[]) {
    return analyzeLine(
        clue, on, off, column, spec.width, false, undefined, undefined,
        complete);
  }

  static findHint(spec: Spec, clues: number[][][], on: boolean[][], off: boolean[][]) {
    let max_inferable = 0;
    let results = [-1, -1];
    for (let pass = 0; pass < 2; pass++) {
      const horizontal = pass === 0;
      const u_size = horizontal ? spec.width : spec.height;
      const v_size = horizontal ? spec.height : spec.width;
      for (let v = 0; v < v_size; v++) {
        const infer_on = [];
        const infer_off = [];
        for (let u = 0; u < u_size; u++) {
          infer_on.push(true);
          infer_off.push(true);
        }
        analyzeLine(
            clues[horizontal ? 0 : 1][v], on, off, v, u_size, horizontal,
            infer_on, infer_off);
        let inferable = 0;
        for (let u = 0; u < u_size; u++) {
          if (infer_on[u]) {
            console.assert(!infer_off[u]);
            if (horizontal) {
              if (!on[v][u]) {
                inferable++;
              }
            } else {
              if (!on[u][v]) {
                inferable++;
              }
            }
          } else if (infer_off[u]) {
            if (horizontal) {
              if (!off[v][u]) {
                inferable++;
              }
            } else {
              if (!off[u][v]) {
                inferable++;
              }
            }
          }
        }
        if (inferable > max_inferable) {
          max_inferable = inferable;
          if (horizontal) {
            results = [v, -1];
          } else {
            results = [-1, v];
          }
        }
      }
    }
    return results;
  }
}
