import type { Graphics } from 'pixi.js';

export enum GameState {
  Idle     = 'idle',
  Dropping = 'dropping',
  Settling = 'settling',
  Result   = 'result'
}

export function isIdleGameState(s: GameState): s is GameState.Idle {
  return s === GameState.Idle;
}

export interface Point {
  x: number
  y: number
}

export interface RoundResult {
  bin: number
  mult: number
  bet: number
  payout: number
  ts: number
  /** How many balls were dropped in this round — same on every entry of the round. */
  roundSize: number
}

/** String key for a peg's position in the grid: "row-col" */
export type PegKey = `${number}-${number}`;

export interface ActiveBall {
  sprite: Graphics
  waypoints: Point[];
  /** Index of the segment currently being traversed (0 = drop→firstPeg). */
  wpIdx: number;
  /** 0..1 progress within the current segment. */
  progress: number;
  speed: number;
  finalBin: number;
  settled: boolean;
}

export interface Geometry {
  pegSpacingX: number
  pegSpacingY: number
  pegRadius: number
  ballRadius: number
  originX: number
  originY: number
  bucketY: number
}
