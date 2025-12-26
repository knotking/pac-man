
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
  DYING = 'DYING',
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

export enum SoundProfile {
  CLASSIC = 'CLASSIC',
  SMOOTH = 'SMOOTH',
  AGGRESSIVE = 'AGGRESSIVE'
}

export enum MusicTrack {
  RETRO = 'RETRO',
  ROCK = 'ROCK',
  TECHNO = 'TECHNO',
  LOFI = 'LOFI'
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
