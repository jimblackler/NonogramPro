export function nameToId(name: string) {
  name = name.toLowerCase();
  let out = '';
  for (const c of name.substring(0, 16)) {
    if (c >= 'a' && c <= 'z') {
      out += c;
    } else if (c >= '0' && c <= '9') {
      out += c;
    } else if ((c === ' ' || c === '_') && out) {
      out += '_';
    }
  }
  return out;
}
