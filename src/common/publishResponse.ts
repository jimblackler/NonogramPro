import {ClientGame} from './gameData';

export interface PublishResponse {
  login?: string;
  game?: ClientGame;
  error?: string;
}
