import { pegPosition, bucketCenter } from '@/utils/geometry';
import type { Geometry, Point } from '@/types/plinko';
import { BALL_DROP_HEIGHT_FACTOR } from '@/constants/ball';

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
 * Returns rows + 2 points: drop point → rows contact points → bucket centre.
 *
 * Each "contact point" is where the ball's *centre* sits when it first touches a
 * peg's surface — i.e. the peg centre offset by (pegRadius + ballRadius) in the
 * direction opposite to the ball's approach.  This prevents the ball from visually
 * sinking into the peg and creates a natural bounce arc between consecutive pegs.
 *
 * Column index (`col`) is accumulated from the path deflections — each 1
 * shifts the column one step to the right before placing the waypoint.
 */
export function buildWaypoints(path: number[], rows: number, g: Geometry): Point[] {
  const pts: Point[] = [];
  const contactDist = g.pegRadius + g.ballRadius;

  // Drop point: centred above the top peg
  pts.push({ x: g.originX, y: g.originY - g.pegSpacingY * BALL_DROP_HEIGHT_FACTOR });

  // Row 0: ball falls straight down from the drop point.
  const firstPeg = pegPosition(0, 0, g);

  pts.push({ x: firstPeg.x, y: firstPeg.y - contactDist });

  // Subsequent pegs: approach direction = (±pegSpacingX/2, +pegSpacingY).
  // path[row-1] = 1 → ball moved right from the previous peg (came from upper-left).
  // path[row-1] = 0 → ball moved left from the previous peg (came from upper-right).
  let col = 0;

  for (let row = 1; row < rows; row++) {
    col += path[row - 1]!;

    const peg = pegPosition(row, col, g);

    // Approach vector from the previous peg toward the current peg centre.
    const approachX = path[row - 1] === 1 ? g.pegSpacingX / 2 : -(g.pegSpacingX / 2);
    const approachY = g.pegSpacingY;
    const approachLen = Math.sqrt(approachX * approachX + approachY * approachY);

    // Contact point = peg centre minus the unit approach vector scaled by contactDist.
    pts.push({
      x: peg.x - (approachX / approachLen) * contactDist,
      y: peg.y - (approachY / approachLen) * contactDist,
    });
  }

  // Last deflection determines the landing bin; bucket centre is the final waypoint.
  col += path[rows - 1]!;
  pts.push(bucketCenter(col, rows, g));

  return pts; // length === rows + 2 (unchanged)
}

/** Standard ease-in-out quadratic: smooth start and end for each segment. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Linear interpolation between a and b at position t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
