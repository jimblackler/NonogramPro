import secrets from './secret/secrets.json';
import {UserInfo} from './userInfo';

export function userCanModify(email: string, collection: string, userInfo: UserInfo) {
  if (email === secrets.administrator) {
    return true;
  }
  return collection === userInfo.screenName;
}
