import {base64Decode} from '../common/base64utils';
import {Spec} from '../common/spec';

export function decode(spec: Spec, str: string) {
  const bits = base64Decode(str);
  const data: boolean[][] = [];
  for (let y = 0; y < spec.height; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < spec.width; x++) {
      row.push(bits.next().value === true);
    }
    data.push(row);
  }
  return data;
}
