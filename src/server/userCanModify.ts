import secrets from './secret/secrets.json';

export function userCanModify(email: string, collection: string) {
  if (email === secrets.administrator) {
    return true;
  }
  return collection === 'default';
}
