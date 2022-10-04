import {Spec} from './spec';

export interface ClientGameData {
  creator: string;
  difficulty: number;
  grid_data: string | boolean[][];
  spec: Spec;
  name: string;
  style: string;
}

export interface ClientGame {
  key: string;
  data: ClientGameData
}
