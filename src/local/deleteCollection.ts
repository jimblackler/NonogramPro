import {datastore} from '../server/globalDatastore';

export async function main() {
  const collection = 'dings';
  const response = await datastore.createQuery('Game')
      .hasAncestor(datastore.key(['Collection', collection])).run();
  const keys = response[0].map(entity => entity[datastore.KEY]);
  await datastore.delete(keys);
}
