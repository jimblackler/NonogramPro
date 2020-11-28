'use strict';

function rangeAdjust(r, r0, r1, n0, n1) {
  const t = (r - r0) / (r1 - r0);
  return t * (n1 - n0) + n0;
}

function* plotLine(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (x1 > x0) {
      for (let x = x0 + 1; x <= x1; x++) {
        yield ({x: x, y: rangeAdjust(x, x0, x1, y0, y1) | 0})
      }
    } else {
      for (let x = x0 - 1; x >= x1; x--) {
        yield ({x: x, y: rangeAdjust(x, x0, x1, y0, y1) | 0})
      }
    }
  } else {
    if (y1 > y0) {
      for (let y = y0 + 1; y <= y1; y++) {
        yield ({x: rangeAdjust(y, y0, y1, x0, x1) | 0, y: y})
      }
    } else if (y1 < y0){
      for (let y = y0 - 1; y >= y1; y--) {
        yield ({x: rangeAdjust(y, y0, y1, x0, x1) | 0, y: y})
      }
    }
  }
}