
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE'
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER'
}

export enum TileType {
  EMPTY = 0,
  WALL = 1,
  PELLET = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  pos: Position;
  dir: Direction;
  nextDir: Direction;
  speed: number;
}

export interface Ghost extends Entity {
  id: string;
  color: string;
  isFrightened: boolean;
  isEaten: boolean;
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  status: GameStatus;
  powerTimer: number;
}
