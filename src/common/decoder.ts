import {base64Decode} from './base64utils';
import {Spec} from './spec';

export function *decode(spec: Spec, str: string) {
  const bits = base64Decode(str);
  for (let y = 0; y < spec.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < spec.width; x++) {
      row.push(bits.next().value === true);
    }
    yield row;
  }
}
