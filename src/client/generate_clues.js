export function generateClues(spec, data) {
  const rows = [];
  let sequence = 0;
  for (let y = 0; y < spec.height; y++) {
    const clue = [];
    for (let x = 0; x <= spec.width; x++) {
      if (x < spec.width && data[y][x]) {
        sequence++;
      } else {
        if (sequence > 0) {
          clue.push(sequence);
          sequence = 0;
        }
      }
    }
    rows.push(clue);
  }
  const columns = [];
  for (let x = 0; x < spec.width; x++) {
    const clue = [];
    for (let y = 0; y <= spec.height; y++) {
      if (y < spec.height && data[y][x]) {
        sequence++;
      } else {
        if (sequence > 0) {
          clue.push(sequence);
          sequence = 0;
        }
      }
    }
    columns.push(clue);
  }
  return [rows, columns];
}