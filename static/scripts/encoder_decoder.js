'use strict';

function encode(data) {
  let binary = '';

  for (let y = 0; y < data.length; y++) {
    const row = data[y];
    let x = 0;
    while (x < row.length) {
      let b = 0;
      let z = 0;
      while(z < 8 && x < row.length) {
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
      binary += String.fromCharCode(b);
    }
  }
  return btoa(binary);
}

function decode(spec, str) {
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