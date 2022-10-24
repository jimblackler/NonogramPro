import {toUint8Array} from 'js-base64';
import {Spec} from '../common/spec';

function* getBits(str: string) {
  const binary = toUint8Array(str);
  for (const byte of binary) {
    for (let bit = 1; bit < 1 << 8; bit <<= 1) {
      yield (byte & bit) !== 0;
    }
  }
}

export function decode(spec: Spec, str: string) {
  const bits = getBits(str);
  const data = [];
  for (let y = 0; y < spec.height; y++) {
    const row = [];
    for (let x = 0; x < spec.width; x++) {
      const data = bits.next();
      if (data.done) {
        throw new Error();
      }
      row.push(data.value);
    }
    data.push(row);
  }
  return data;
}
