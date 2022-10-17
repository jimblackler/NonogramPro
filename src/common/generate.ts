import {Spec} from './spec';

export class Generate {
  static getEmpty(spec: Spec): boolean[][] {
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

  static clone(arr: boolean[][]) {
    const cloned: boolean[][] = [];
    arr.forEach(row => cloned.push(row.slice(0)));
    return cloned;
  }

  static equals(arr0: boolean[][], arr1: boolean[][]) {
    return arr0.every((row, row_number) => {
      return row.every((value, column_number) => {
        return value === arr1[row_number][column_number];
      });
    });
  }

  static complete(on: boolean[][], off: boolean[][]) {
    return on.every((on_row, row_number) => {
      return on_row.every((value, column_number) => {
        return value || off[row_number][column_number];
      });
    });
  }
}
