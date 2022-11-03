import {GameInDb} from '../server/gameToClientGame';
import {datastore} from '../server/globalDatastore';

export async function main() {
  const games = await datastore.createQuery('Game').run().then(result => result[0] as GameInDb[]);

  const grids = new Map<string, string>();
  for (const game of games) {
    const key = game[datastore.KEY];
    const gameId = `${key.parent?.name}.${key.name}`;
    const previous = grids.get(game.gridData);
    if (previous) {
      console.log(`${gameId} dupes ${previous}`);
      await datastore.delete(key);
      continue;
    }
    grids.set(game.gridData, gameId);
  }
}
