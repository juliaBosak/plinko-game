import { Graphics, Sprite } from 'pixi.js';
import type { Application, Texture, Container } from 'pixi.js';
import type { ActiveBall, Point, PegKey } from '@/types/plinko';
import { lerp } from '@/utils/physics';
import { TRAIL_COUNT, TRAIL_ALPHA, TRAIL_RADIUS_FACTOR } from '@/constants/layout';
import {
  BALL_BASE_SPEED,
  BALL_GRAVITY_FACTOR,
  BALL_GRAVITY_INTERVAL,
  BALL_ARC_FACTOR,
  BALL_FREE_FALL_EXPONENT,
  BALL_HIGHLIGHT_OFFSET,
  BALL_HIGHLIGHT_RADIUS,
  BALL_HIGHLIGHT_ALPHA,
} from '@/constants/ball';
import { BALL_COLOR, BALL_HIGHLIGHT } from '@/constants/colors';

// ─── Ball texture ────────────────────────────────────────────────────────────

/**
 * Renders a single ball to a GPU texture so trail ghost `Sprite`s can share it.
 * Destroy the previous texture before calling again (e.g. on rows / canvas change).
 */
export function buildBallTexture(app: Application, radius: number): Texture {
  const g = new Graphics();

  g.circle(0, 0, radius).fill({ color: BALL_COLOR });
  // Highlight to give a slight 3-D feel
  g.circle(
    radius * BALL_HIGHLIGHT_OFFSET,
    radius * BALL_HIGHLIGHT_OFFSET,
    radius * BALL_HIGHLIGHT_RADIUS
  ).fill({ color: BALL_HIGHLIGHT, alpha: BALL_HIGHLIGHT_ALPHA });

  const tex = app.renderer.generateTexture({ target: g, padding: 1 });

  g.destroy();

  return tex;
}

// ─── Ball graphics ───────────────────────────────────────────────────────────

/** Creates the main ball Graphics object (drawn once per ball, not textured). */
export function createBall(radius: number): Graphics {
  const g = new Graphics();

  g.circle(0, 0, radius).fill({ color: BALL_COLOR });
  g.circle(
    radius * BALL_HIGHLIGHT_OFFSET,
    radius * BALL_HIGHLIGHT_OFFSET,
    radius * BALL_HIGHLIGHT_RADIUS
  ).fill({ color: BALL_HIGHLIGHT, alpha: BALL_HIGHLIGHT_ALPHA });

  return g;
}

// ─── Trail ───────────────────────────────────────────────────────────────────

/**
 * Allocates TRAIL_COUNT ghost `Sprite`s from the shared ball texture,
 * adds them to `layer`, and returns them oldest-first (index 0 = most faded).
 * Ghosts start invisible — `updateTrail` makes them visible once the ball moves.
 */
export function createTrailGhosts(
  texture: Texture,
  radius: number,
  layer: Container
): Sprite[] {
  return Array.from({ length: TRAIL_COUNT }, (_, i) => {
    const s = new Sprite(texture);

    s.anchor.set(0.5);
    s.alpha   = TRAIL_ALPHA[i] ?? 0.1;

    // Scale ghost so it appears slightly smaller than the ball
    const sf  = TRAIL_RADIUS_FACTOR[i] ?? 0.5;

    // The texture was generated at radius `r`; the Sprite's natural size IS the
    // ball, so we just need to scale by the factor directly.
    s.scale.set(sf);
    s.visible = false;
    layer.addChild(s);

    return s;
  });
}

/**
 * Pushes the ball's current position into the trail ring-buffer and updates
 * all ghost sprite positions.  Called at the end of every `stepBall` frame.
 */
function updateTrail(b: ActiveBall): void {
  b.trailPositions[b.trailHead] = { x: b.sprite.x, y: b.sprite.y };
  b.trailHead = (b.trailHead + 1) % TRAIL_COUNT;

  for (let i = 0; i < TRAIL_COUNT; i++) {
    const idx   = (b.trailHead + i) % TRAIL_COUNT;
    const ghost = b.trail[i]!;

    ghost.x       = b.trailPositions[idx]!.x;
    ghost.y       = b.trailPositions[idx]!.y;
    ghost.visible = true;
  }
}

// ─── ActiveBall factory ───────────────────────────────────────────────────────

/** Builds the initial `ActiveBall` state for a newly spawned ball. */
export function makeActiveBall(
  sprite: Graphics,
  trail: Sprite[],
  waypoints: Point[],
  pegKeys: Array<PegKey | null>,
  finalBin: number,
  delayMs = 0
): ActiveBall {
  return {
    sprite,
    trail,
    trailPositions: Array.from({ length: TRAIL_COUNT }, () => ({ x: 0, y: 0 })),
    trailHead: 0,
    pegKeys,
    waypoints,
    wpIdx: 0,
    progress: 0,
    speed: BALL_BASE_SPEED,
    finalBin,
    settled: false,
    delayMs,
  };
}

// ─── Per-frame step ───────────────────────────────────────────────────────────

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

  b.speed = BALL_BASE_SPEED * (1 + Math.floor(b.wpIdx / BALL_GRAVITY_INTERVAL) * BALL_GRAVITY_FACTOR);

  b.progress += (dt / 60) * b.speed;

  while (b.progress >= 1) {
    b.progress -= 1;
    b.wpIdx++;

    if (b.wpIdx >= b.waypoints.length - 1) {
      const last = b.waypoints[b.waypoints.length - 1]!;

      b.sprite.x = last.x;
      b.sprite.y = last.y;
      b.settled  = true;
      onSettle(b.finalBin);

      return;
    }

    onPeg(b.waypoints[b.wpIdx]!, b.wpIdx);
  }

  // Interpolate sprite position within the current segment
  const from = b.waypoints[b.wpIdx]!;
  const to   = b.waypoints[b.wpIdx + 1]!;
  const t    = b.progress; // raw 0..1

  const isLastSeg = b.wpIdx >= b.waypoints.length - 2;

  if (isLastSeg) {
    // Free-fall into bucket: x keeps constant horizontal momentum, y accelerates
    // under gravity (t² curve).  b.speed already carries the accumulated gravity
    // factor that controls how fast the segment is traversed.
    b.sprite.x = lerp(from.x, to.x, t);
    b.sprite.y = lerp(from.y, to.y, t ** BALL_FREE_FALL_EXPONENT);
  }
  else {
    // Peg-to-peg: constant horizontal speed + parabolic bounce arc on y.
    // sin(π·t) peaks at t=0.5, so the ball lifts off the first peg surface,
    // arcs upward to the midpoint, then falls onto the next peg surface.
    const dy        = to.y - from.y;
    const arcHeight = Math.abs(dy) * BALL_ARC_FACTOR;

    b.sprite.x = lerp(from.x, to.x, t);
    b.sprite.y = lerp(from.y, to.y, t) - arcHeight * Math.sin(Math.PI * t);
  }

  updateTrail(b);
}
