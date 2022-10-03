import {ParsedQs} from 'qs';

export function getParam(query: ParsedQs, signerHash: string) {
  const element = query[signerHash];
  if (typeof element === 'string') {
    return element;
  }
  return null;
}
