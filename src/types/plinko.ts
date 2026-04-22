export type GameState = 'idle' | 'dropping' | 'settling' | 'result';

export function isIdleGameState(s: GameState): s is 'idle' {
  return s === 'idle';
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
}

/** String key for a peg's position in the grid: "row-col" */
export type PegKey = `${number}-${number}`;

export interface Geometry {
  pegSpacingX: number
  pegSpacingY: number
  pegRadius: number
  ballRadius: number
  originX: number
  originY: number
  bucketY: number
}

export interface ActiveBall {
  waypoints: Point[]
  wpIdx: number
  progress: number
  speed: number
  finalBin: number
  settled: boolean
}
