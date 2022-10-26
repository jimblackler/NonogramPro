const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// https://www.rfc-editor.org/rfc/rfc4648#section-4
// "The Base 64 encoding is designed to represent arbitrary sequences of octets..."
function* toOctets(generator: Generator<boolean>) {
  let bits = 0;
  for (const bit of generator) {
    yield bit;
    bits++;
  }
  while (bits % 8) {
    yield false;  // https://www.rfc-editor.org/rfc/rfc4648#section-3.5
    bits++;
  }
}

const PADDING_CHARACTER = BASE64_ALPHABET[64];

export function base64Encode(generator: Generator<boolean>) {
  let encoded = '';
  let byte = 0;
  let bit = 32;

  for (const cell of toOctets(generator)) {
    if (cell) {
      byte |= bit;
    }
    bit >>= 1;
    if (!bit) {
      encoded += BASE64_ALPHABET[byte];
      byte = 0;
      bit = 32;
    }
  }

  if (bit !== 32) {
    encoded += BASE64_ALPHABET[byte];
  }

  while (encoded.length % 4) {  // https://www.rfc-editor.org/rfc/rfc4648#section-4
    encoded += PADDING_CHARACTER;
  }
  return encoded;
}

/* Warning: Naive decoder that will generate extra bits beyond the end point.*/
export function* base64Decode(str: string) {
  for (const chr of str) {
    const bits = BASE64_ALPHABET.indexOf(chr);
    for (let bit = 32; bit; bit >>= 1) {
      yield (bits & bit) !== 0;
    }
  }
}
