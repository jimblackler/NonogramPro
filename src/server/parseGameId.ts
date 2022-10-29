export function parseGameId(gameId: string) {
  const dotPosition = gameId.indexOf('.');
  if (dotPosition === -1) {
    throw new Error();
  }
  return {
    collection: gameId.substring(0, dotPosition),
    rawName: gameId.substring(dotPosition + 1)
  };
}
