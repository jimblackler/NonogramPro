import {Spec} from './spec';

export interface GameData {
  name: string;
  gridData: string;
  creatorEmail?: string;
  creatorScreenName?: string;
  difficulty: number;
  license?: string;
  spec: Spec;
  style?: string;
  needsPublish?: boolean;
}

export interface ClientGame {
  key: string;
  data: GameData
}
