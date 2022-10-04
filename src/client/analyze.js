import {Generate} from '/src/client/generate.js';
import {Renderer} from '/src/client/renderer.js';
require('/src/client/dialog.js');

function analyzeSequence(
    clue, clue_idx, on, off, start, max_start, u_size, v, horizontal, infer_on,
    infer_off, complete) {
  if (clue_idx === clue.length) {
    /* We have a viable combination provided no 'on' blocks remain. */
    for (let u = start; u < u_size; u++) {
      if (horizontal ? on[v][u] : on[u][v]) {
        return false;
      }
    }
    /* We have end of a viable combination. */
    if (infer_on) {
      for (let u = start; u < u_size; u++) {
        infer_on[u] = false;
      }
    }
    return true;
  }

  let viable = false;
  const block_length = clue[clue_idx];
  let run_length = 0;
  let stop_scan = max_start + block_length;
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
    if (u + 1 < u_size && (horizontal ? on[v][u + 1] : on[u + 1][v])) {
      // No spacer.
      continue;
    }
    if (!analyzeSequence(
            clue, clue_idx + 1, on, off, u + 2, max_start + block_length + 1,
            u_size, v, horizontal, infer_on, infer_off, complete)) {
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
        complete[clue_idx] = -3;
      } else if (complete[clue_idx] === -1) {
        complete[clue_idx] = block_start;
      } else if (complete[clue_idx] !== block_start) {
        complete[clue_idx] = -2;
      }
    }
    if (!infer_on) {
      continue;
    }

    if (u + 1 < u_size) {
      infer_on[u + 1] = false;
    }
    let u0 = u;
    while (u0 >= block_start) {
      infer_off[u0] = false;
      u0--;
    }
    while (u0 >= start) {
      infer_on[u0] = false;
      u0--;
    }
  }
  return viable;
}

function analyzeLine(
    clue, on, off, v, u_size, horizontal, infer_on, infer_off, complete) {
  let max_start = u_size;
  let spacer = 0;
  for (let idx = 0; idx < clue.length; idx++) {
    max_start -= clue[idx];
    max_start -= spacer;
    spacer = 1;
  }

  return analyzeSequence(
      clue, 0, on, off, 0, max_start, u_size, v, horizontal, infer_on,
      infer_off, complete);
}

function analyzePass(spec, clues, on, off, horizontal) {
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

function draw(spec, on, prior_on, off, prior_off) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('mini');
  const renderer = new Renderer(svg, spec, {cell_size: 10, ratio_for_clues: 0});
  renderer.paintOnSquares(on, prior_on);
  renderer.paintOffSquares(off, prior_off);
  return svg;
}

export class Analyze {
  static analyze(spec, clues, per_round) {
    const on = Generate.getEmpty(spec);
    const off = Generate.getEmpty(spec);
    let failed = 0;
    let horizontal = true;
    let rounds = 0;

    while (true) {
      const prior_on = Generate.clone(on);
      const prior_off = Generate.clone(off);
      analyzePass(spec, clues, on, off, horizontal);
      if (Generate.equals(on, prior_on) && Generate.equals(off, prior_off)) {
        failed++;
        if (failed === 2) {
          return -1;
        }
      } else {
        failed = 0;
      }
      per_round(on, prior_on, off, prior_off);

      if (Generate.complete(on, off)) {
        return rounds;
      }

      horizontal = !horizontal;
      rounds++;
    }
  }

  static visualAnalyze(spec, clues) {
    document.getElementById('dialog').style.visibility = 'visible';
    const div = document.getElementById('dialog_content');

    while (div.firstChild) {
      div.removeChild(div.firstChild);
    }
    const header = document.createElement('header');
    div.appendChild(header);

    let difficulty = Analyze.analyze(
        spec, clues,
        (on, prior_on, off, prior_off) =>
            div.appendChild(draw(spec, on, prior_on, off, prior_off)));

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

  static checkRow(spec, on, off, row, clue, complete) {
    return analyzeLine(
        clue, on, off, row, spec.height, true, undefined, undefined, complete);
  }

  static checkColumn(spec, on, off, column, clue, complete) {
    return analyzeLine(
        clue, on, off, column, spec.width, false, undefined, undefined,
        complete);
  }

  static findHint(spec, clues, on, off) {
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
