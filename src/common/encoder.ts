import {fromUint8Array} from 'js-base64';

export function encode(data: boolean[][]) {
  let binary: number[] = [];

  for (let y = 0; y < data.length; y++) {
    const row = data[y];
    let x = 0;
    while (x < row.length) {
      let b = 0;
      let z = 0;
      while (z < 8 && x < row.length) {
        b *= 2;
        if (row[x]) {
          b += 1;
        }
        x++;
        z++;
      }
      while (z < 8) {
        b <<= 1;
        z++;
      }
      binary.push(b);
    }
  }
  return fromUint8Array(new Uint8Array(binary));
}
