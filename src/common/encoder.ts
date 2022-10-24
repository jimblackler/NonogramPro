import {fromUint8Array} from 'js-base64';

function* allCells(data: boolean[][]) {
  for (const row of data) {
    for (const cell of row) {
      yield cell;
    }
  }
}

export function encode(data: boolean[][]) {
  let binary: number[] = [];
  let bit = 1;
  let byte = 0;

  for (const cell of allCells(data)) {
    if (cell) {
      byte |= bit;
    }
    bit <<= 1;
    if (bit === 1 << 8) {
      binary.push(byte);
      bit = 1;
      byte = 0;
    }
  }

  binary.push(byte);
  return fromUint8Array(new Uint8Array(binary));
}
