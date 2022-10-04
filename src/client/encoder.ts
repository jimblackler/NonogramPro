export function encode(data: string) {
  let binary = '';

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
      binary += String.fromCharCode(b);
    }
  }
  return btoa(binary);
}
