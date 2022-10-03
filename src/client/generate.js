import {Alea} from '/src/client/third_party/alea.js';

export class Generate {
  static getEmpty(spec) {
    const data = [];
    for (let y = 0; y < spec.height; y++) {
      const row = [];
      for (let x = 0; x < spec.width; x++) {
        row.push(false);
      }
      data.push(row);
    }
    return data;
  }

  static clone(arr) {
    const cloned = [];
    arr.forEach(row => cloned.push(row.slice(0)));
    return cloned;
  }

  static equals(arr0, arr1) {
    return arr0.every((row, row_number) => {
      return row.every((value, column_number) => {
        return value === arr1[row_number][column_number];
      });
    });
  }

  static complete(on, off) {
    return on.every((on_row, row_number) => {
      return on_row.every((value, column_number) => {
        return value || off[row_number][column_number];
      });
    });
  }
}

function generate(spec) {
  const random = new Alea();

  const data = [];
  for (let y = 0; y < spec.height; y++) {
    const row = [];
    for (let x = 0; x < spec.width; x++) {
      row.push(random() < .40);
    }
    data.push(row);
  }

  for (let count = 0; count < 5000; count++) {
    const x = random() * spec.width | 0;
    const y = random() * spec.height | 0;
    data[y][x] = true;
    const mode = random() * 4 | 0;
    if (mode === 0) {
      data[y][x] = data[y === 0 ? spec.height - 1 : y - 1][x];
    } else if (mode === 1) {
      data[y][x] = data[y][x === spec.width - 1 ? 0 : x + 1];
    } else if (mode === 2) {
      data[y][x] = data[y === spec.height - 1 ? 0 : y + 1][x];
    } else if (mode === 3) {
      data[y][x] = data[y][x === 0 ? spec.width - 1 : x - 1];
    }
  }

  return data;
}
