import {BASE64_ALPHABET} from '../common/base64utils';
import {Spec} from '../common/spec';

function* getBits(str: string) {
  for (const chr of str) {
    const bits = BASE64_ALPHABET.indexOf(chr);
    for (let bit = 32; bit; bit >>= 1) {
      yield (bits & bit) !== 0;
    }
  }
}

export function decode(spec: Spec, str: string) {
  const bits = getBits(str);
  const data = [];
  for (let y = 0; y < spec.height; y++) {
    const row = [];
    for (let x = 0; x < spec.width; x++) {
      row.push(bits.next().value);
    }
    data.push(row);
  }
  return data;
}
