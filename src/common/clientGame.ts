import {Spec} from './spec';

export interface ClientGameData {
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
  data: ClientGameData
}
