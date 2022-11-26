import {ParsedQs} from 'qs';

export function getParam(query: ParsedQs, parameterName: string) {
  const element = query[parameterName];
  if (typeof element === 'string') {
    return element;
  }
  return null;
}
