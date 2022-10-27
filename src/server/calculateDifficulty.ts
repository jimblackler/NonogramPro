import {assertDefined} from '../common/check/defined';
import {generateClues} from '../common/generateClues';
import {isComplete, Round, solve} from '../common/solve';
import {Spec} from '../common/spec';

export function calculateDifficulty(spec: Spec, gridData: boolean[][]) {
  const clues = generateClues(spec, gridData);
  let difficulty = 0;
  let lastRound: Round | undefined;
  for (const round of solve(spec, clues)) {
    difficulty++;
    lastRound = round;
  }

  return isComplete(spec, assertDefined(lastRound)) ? difficulty : 0;
}
