import { pegPosition, bucketCenter } from '@/utils/geometry';
import type { Geometry, Point } from '@/types/plinko';

/**
 * Generates a random path of `rows` binary deflections.
 * 0 = deflect left, 1 = deflect right.
 * The cumulative sum of the path determines the final bin (0..rows).
 */
export function computePath(rows: number): number[] {
  return Array.from({ length: rows }, () => (Math.random() < 0.5 ? 0 : 1));
}

/**
 * Converts a binary path into canvas waypoints the ball will follow.
 * Returns rows + 2 points: drop point → rows peg positions → bucket centre.
 *
 * Column index (`col`) is accumulated from the path deflections — each 1
 * shifts the column one step to the right before placing the waypoint.
 * This maps naturally onto the triangular peg grid where col ≤ row+1.
 */
export function buildWaypoints(path: number[], rows: number, g: Geometry): Point[] {
  const pts: Point[] = [];

  // Drop point: centred above the top peg
  pts.push({ x: g.originX, y: g.originY - g.pegSpacingY * 0.8 });

  // The ball always hits the single top peg at row 0 first
  pts.push(pegPosition(0, 0, g));

  // Each subsequent peg: deflection at the previous peg shifts col left/right
  let col = 0;
  for (let row = 1; row < rows; row++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    col += path[row - 1]!;
    pts.push(pegPosition(row, col, g));
  }

  // Last deflection (at the bottom-row peg) determines the landing bin
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  col += path[rows - 1]!;
  pts.push(bucketCenter(col, rows, g));

  return pts; // length === rows + 2
}

/** Standard ease-in-out quadratic: smooth start and end for each segment. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Linear interpolation between a and b at position t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
