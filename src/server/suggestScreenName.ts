import {nameToId} from './nameToId';

export function suggestScreenName(email: string) {
  const atPosition = email.indexOf('@');
  if (atPosition === -1) {
    throw new Error();
  }
  return nameToId(email.substring(0, atPosition));
}
