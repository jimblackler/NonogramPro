import {datastore} from '../server/globalDatastore';
import {shard} from './shard';

function deleteAll(kind: string) {
  return datastore.createQuery(kind)
      .run()
      .then(result => result[0])
      .then(elements => elements.map(element => element[datastore.KEY]))
      .then(keys => Promise.all(shard(keys, 500).map(part => datastore.delete(part))));
}

export async function main() {
  await Promise.all(['game', 'tag'].map(entity => deleteAll(entity)));
}
