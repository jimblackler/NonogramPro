import {BASE64_ALPHABET} from './base64utils';

function* allCells(data: boolean[][]) {
  for (const row of data) {
    for (const cell of row) {
      yield cell;
    }
  }
}

export function encode(data: boolean[][]) {
  let encoded = '';
  let bit = 32;
  let byte = 0;
  let totalBits = 0;

  for (const cell of allCells(data)) {
    totalBits++;
    if (cell) {
      byte |= bit;
    }
    bit >>= 1;
    if (!bit) {
      encoded += BASE64_ALPHABET[byte];
      bit = 32;
      byte = 0;
    }
  }

  // https://www.rfc-editor.org/rfc/rfc4648#section-4
  // "The Base 64 encoding is designed to represent arbitrary sequences of octets..."
  while (totalBits % 8) {
    totalBits++;
    bit >>= 1;
    if (!bit) {
      encoded += BASE64_ALPHABET[byte];
      bit = 32;
      byte = 0;  // https://www.rfc-editor.org/rfc/rfc4648#section-3.5
    }
  }

  if (bit !== 32) {
    encoded += BASE64_ALPHABET[byte];
  }

  while (encoded.length % 4) {  // https://www.rfc-editor.org/rfc/rfc4648#section-4
    encoded += BASE64_ALPHABET[64];
  }
  return encoded;
}
