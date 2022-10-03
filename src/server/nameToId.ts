export function nameToId(name: string) {
  let out = '';
  for (const c of name) {
    if (c >= 'a' && c <= 'z') {
      out += c;
    } else if (c >= '0' && c <= '9') {
      out += c;
    } else if (c === ' ') {
      out += '_';
    }
  }
  return out;
}
