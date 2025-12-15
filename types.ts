export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface LevelTheme {
  name: string;
  description: string;
  backgroundColor: string; // Hex code
  groundColor: string; // Hex code
  playerColor: string; // Hex code
  obstacleColor: string; // Hex code
  skyColor: string; // Hex code
  gravity: number; // 0.5 to 1.5 usually
  speed: number; // Base speed
  jumpStrength: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Player extends Entity {
  dy: number;
  isJumping: boolean;
}

export interface Obstacle extends Entity {
  speed: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}