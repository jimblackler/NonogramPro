import {datastore} from './main';

export async function getGame(id: string) {
  return (await datastore.get(datastore.key(['game', id])))[0];
}
