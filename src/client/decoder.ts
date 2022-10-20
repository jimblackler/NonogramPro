import {toUint8Array} from 'js-base64';
import {Spec} from '../common/spec';
import {defined} from './defined';

export function decode(spec: Spec, str: string) {
  const binary = toUint8Array(str);
  let pos = 0;
  const data = [];
  for (let y = 0; y < spec.height; y++) {
    let x = 0;
    const row = [];
    while (x < spec.width) {
      let byte = defined(binary.at(pos++));
      for (let mask = 1 << 7; mask && x < spec.width; mask >>= 1) {
        row.push((byte & mask) !== 0);
        x++;
      }
    }
    data.push(row);
  }
  return data;
}
