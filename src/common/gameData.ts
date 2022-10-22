import {Spec} from './spec';

export interface GameData {
  creator?: string;
  difficulty: number;
  gridData: string | boolean[][];
  spec: Spec;
  name: string;
  style: string;
  needsPublish?: boolean;
}

export interface ClientGame {
  key: string;
  data: GameData
}
