import {Spec} from './spec';

export interface GameData {
  name: string;
  gridData: string;
  creator?: string;
  difficulty: number;
  spec: Spec;
  style?: string;
  needsPublish?: boolean;
}

export interface ClientGame {
  key: string;
  data: GameData
}
