import {analyzeLine} from '../common/solve';
import {Spec} from '../common/spec';

export function checkRow(spec: Spec, on: boolean[][], off: boolean[][], row: number, clue: number[],
                         complete: number[]) {
  return analyzeLine(clue, on, off, row, spec.height, true, undefined, undefined, complete);
}

export function checkColumn(spec: Spec, on: boolean[][], off: boolean[][], column: number,
                            clue: number[], complete: number[]) {
  return analyzeLine(clue, on, off, column, spec.width, false, undefined, undefined, complete);
}

export function findHint(spec: Spec, clues: number[][][], on: boolean[][], off: boolean[][]) {
  let maxInferable = 0;
  let results = [-1, -1];
  for (let pass = 0; pass < 2; pass++) {
    const horizontal = pass === 0;
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
      let inferable = 0;
      for (let u = 0; u < uSize; u++) {
        if (inferOn[u]) {
          console.assert(!inferOff[u]);
          if (horizontal) {
            if (!on[v][u]) {
              inferable++;
            }
          } else {
            if (!on[u][v]) {
              inferable++;
            }
          }
        } else if (inferOff[u]) {
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
      if (inferable > maxInferable) {
        maxInferable = inferable;
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

