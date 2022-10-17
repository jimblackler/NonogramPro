import {clone, complete, equals, getEmpty} from './generate';
import {Spec} from './spec';

export type Round = {
  priorOn: boolean[][];
  priorOff: boolean[][];
  off: boolean[][];
  on: boolean[][]
};

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
  const blockLength = clue[clueIdx];
  let runLength = 0;
  let stopScan = maxStart + blockLength;
  for (let u = start; u < stopScan; u++) {
    if (horizontal ? off[v][u] : off[u][v]) {
      runLength = 0;
      continue;
    }
    if (horizontal ? on[v][u] : on[u][v]) {
      if (u + blockLength < stopScan) {
        stopScan = u + blockLength;
      }
    }

    runLength += 1;
    if (runLength < blockLength) {
      // Block not long enough.
      continue;
    }
    if (u + 1 < uSize && (horizontal ? on[v][u + 1] : on[u + 1][v])) {
      // No spacer.
      continue;
    }
    if (!analyzeSequence(clue, clueIdx + 1, on, off, u + 2, maxStart + blockLength + 1, uSize, v,
        horizontal, inferOn, inferOff, complete)) {
      // No solutions for the rest of the sequence.
      continue;
    }

    viable = true;

    const blockStart = u - blockLength + 1;
    if (complete) {
      let filled = true;
      for (let u0 = blockStart; u0 <= u && filled; u0++) {
        if (horizontal ? !on[v][u0] : !on[u0][v]) {
          filled = false;
        }
      }
      if (!filled) {
        complete[clueIdx] = -3;
      } else if (complete[clueIdx] === -1) {
        complete[clueIdx] = blockStart;
      } else if (complete[clueIdx] !== blockStart) {
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
    while (u0 >= blockStart) {
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

export function analyzeLine(clue: number[], on: boolean[][], off: boolean[][], v: number, uSize: number,
                            horizontal: boolean, inferOn: boolean[] | undefined,
                            inferOff: boolean[] | undefined, complete?: number[]) {
  let maxStart = uSize;
  let spacer = 0;
  for (let idx = 0; idx < clue.length; idx++) {
    maxStart -= clue[idx];
    maxStart -= spacer;
    spacer = 1;
  }

  return analyzeSequence(
      clue, 0, on, off, 0, maxStart, uSize, v, horizontal, inferOn, inferOff, complete);
}

function analyzePass(
    spec: Spec, clues: number[][][], on: boolean[][], off: boolean[][], horizontal: boolean) {
  const uSize = horizontal ? spec.width : spec.height;
  const vSize = horizontal ? spec.height : spec.width;
  for (let v = 0; v < vSize; v++) {
    const inferOn = [];
    const inferOff = [];
    for (let u = 0; u < uSize; u++) {
      inferOn.push(true);
      inferOff.push(true);
    }
    analyzeLine(clues[horizontal ? 0 : 1][v], on, off, v, uSize, horizontal, inferOn, inferOff);
    for (let u = 0; u < uSize; u++) {
      if (inferOn[u]) {
        console.assert(!inferOff[u]);
        if (horizontal) {
          on[v][u] = true;
        } else {
          on[u][v] = true;
        }
      } else if (inferOff[u]) {
        if (horizontal) {
          off[v][u] = true;
        } else {
          off[u][v] = true;
        }
      }
    }
  }
}

export function* solve(spec: Spec, clues: number[][][]): Iterable<Round> {
  const on = getEmpty(spec);
  const off = getEmpty(spec);
  let failed = 0;
  let horizontal = true;

  while (true) {
    const priorOn = clone(on);
    const priorOff = clone(off);
    analyzePass(spec, clues, on, off, horizontal);
    if (equals(on, priorOn) && equals(off, priorOff)) {
      failed++;
      if (failed === 2) {
        return;
      }
    } else {
      failed = 0;
    }
    yield {on: clone(on), priorOn, off: clone(off), priorOff};

    if (complete(on, off)) {
      return;
    }

    horizontal = !horizontal;
  }
}

export function isComplete(spec: Spec, round: Round) {
  for (let y = 0; y !== spec.height; y++) {
    for (let x = 0; x !== spec.width; x++) {
      if (!(round.on[y][x] || round.off[y][x])) {
        return false;
      }
    }
  }
  return true;
}
