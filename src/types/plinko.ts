import type { Graphics, Sprite } from 'pixi.js';

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
  /** Three ghost Sprites trailing behind the ball. */
  trail: Sprite[];
  /** Ring-buffer storing the last TRAIL_COUNT ball positions. */
  trailPositions: Point[];
  /** Ring-buffer write head. */
  trailHead: number;
  /** PegKey at each waypoint index (null for drop-point and bucket waypoints). */
  pegKeys: Array<PegKey | null>;
  waypoints: Point[];
  /** Index of the segment currently being traversed (0 = drop→firstPeg). */
  wpIdx: number;
  /** 0..1 progress within the current segment. */
  progress: number;
  speed: number;
  finalBin: number;
  settled: boolean;
  /**
   * Milliseconds remaining before this ball starts animating.
   * While > 0 the sprite is hidden and stepBall is skipped.
   */
  delayMs: number;
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
