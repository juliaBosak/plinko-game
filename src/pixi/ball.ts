import { Graphics } from 'pixi.js';
import type { ActiveBall, Point } from '@/types/plinko';
import { easeInOutQuad, lerp } from '@/utils/physics';

const BASE_SPEED = 4.5; // segments per second at row 0

/** Draws a solid purple ball slightly larger than the pegs. */
export function createBall(radius: number): Graphics {
  const r = radius;
  const g = new Graphics();

  g.circle(0, 0, r).fill({ color: 0x7c4dff });

  return g;
}

/** Builds the initial ActiveBall state for a newly spawned ball. */
export function makeActiveBall(
  sprite: Graphics,
  waypoints: Point[],
  finalBin: number
): ActiveBall {
  return {
    sprite,
    waypoints,
    wpIdx: 0,
    progress: 0,
    speed: BASE_SPEED,
    finalBin,
    settled: false,
  };
}

/**
 * Advances `b` by one ticker tick.
 *
 * @param dt        ticker.deltaTime (60-fps-normalised delta)
 * @param onPeg     called each time the ball arrives at a peg waypoint
 * @param onSettle  called once when the ball reaches its landing bucket
 */
export function stepBall(
  b: ActiveBall,
  dt: number,
  onPeg: (p: Point, wpIdx: number) => void,
  onSettle: (bin: number) => void
): void {
  if (b.settled) return;

  // Gravity illusion: speed grows by 15 % every 4 completed segments
  b.speed = BASE_SPEED * (1 + Math.floor(b.wpIdx / 4) * 0.15);

  b.progress += (dt / 60) * b.speed;

  while (b.progress >= 1) {
    b.progress -= 1;
    b.wpIdx++;

    // Has the ball reached the final bucket waypoint?
    if (b.wpIdx >= b.waypoints.length - 1) {
      const last = b.waypoints[b.waypoints.length - 1]!;

      b.sprite.x = last.x;
      b.sprite.y = last.y;
      b.settled = true;
      onSettle(b.finalBin);

      return;
    }

    onPeg(b.waypoints[b.wpIdx]!, b.wpIdx);
  }

  // Interpolate sprite position within the current segment
  const from = b.waypoints[b.wpIdx]!;
  const to   = b.waypoints[b.wpIdx + 1]!;
  const t    = easeInOutQuad(b.progress);

  b.sprite.x = lerp(from.x, to.x, t);
  b.sprite.y = lerp(from.y, to.y, t);
}
