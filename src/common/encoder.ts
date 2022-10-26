import {base64Encode} from './base64utils';

function* allCells(data: boolean[][]) {
  for (const row of data) {
    for (const cell of row) {
      yield cell;
    }
  }
}

export function encode(data: boolean[][]) {
  return base64Encode(allCells(data));
}
