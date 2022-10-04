import {Spec} from './spec';

export interface ClientGame {
  key: string;
  data: {
    creator: string;
    difficulty: number;
    grid_data: string;
    spec: Spec;
    name: string;
    style: string;
  }
}
