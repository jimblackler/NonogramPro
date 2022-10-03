export function decode(spec, str) {
  const binary = atob(str);
  let pos = 0;
  let data = [];
  for (let y = 0; y < spec.height; y++) {
    let x = 0;
    const row = [];
    while (x < spec.width) {
      let byte = binary.charCodeAt(pos++);
      for (let mask = 1 << 7; mask && x < spec.width; mask >>= 1) {
        row.push((byte & mask) !== 0);
        x++;
      }
    }
    data.push(row);
  }
  return data;
}