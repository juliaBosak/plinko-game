// ─── Physics / animation ────────────────────────────────────────────────────

/**
 * How many full peg-to-peg segments the ball travels per second at the very
 * start of the drop (row 0).  Higher = faster overall animation.
 * Typical range: 1 (slow) … 4 (very fast).
 */
export const BALL_BASE_SPEED = 2;

/**
 * Milliseconds to wait before each successive ball in a multi-ball drop begins
 * its animation.  Ball 0 starts immediately; ball N starts after N × this value.
 * This prevents all balls from stacking at the drop point and looking like one.
 *   0   → all balls start simultaneously (old behaviour)
 * 150   → subtle stagger, balls separate quickly
 * 300   → clearly visible stagger (default)
 * 600   → very noticeable cascade effect
 */
export const BALL_SPAWN_DELAY_MS = 300;

/**
 * How much faster the ball gets after every BALL_GRAVITY_INTERVAL segments.
 * Applied as: speed = BASE_SPEED × (1 + completedSteps × GRAVITY_FACTOR).
 * 0.15 means +15 % per step.  Set to 0 to disable speed-up entirely.
 * Typical range: 0.05 (subtle) … 0.30 (aggressive).
 */
export const BALL_GRAVITY_FACTOR = 0.15;

/**
 * Number of completed segments that must pass before the next speed-up step
 * is applied.  Works together with BALL_GRAVITY_FACTOR.
 * Lower = speed increases more often (steeper acceleration curve).
 * Typical range: 2 (fast ramp) … 8 (slow ramp).
 */
export const BALL_GRAVITY_INTERVAL = 4;

/**
 * Controls how high the ball arcs between two pegs, expressed as a fraction
 * of the vertical distance between the two contact points.
 *   0   → straight line, no visible bounce
 *   0.5 → ball lifts halfway back up before falling to the next peg
 *   1   → ball peaks as high above the midpoint as the pegs are apart
 * Typical range: 0.3 (subtle) … 0.8 (exaggerated).
 */
export const BALL_ARC_FACTOR = 0.65;

/**
 * Exponent N of the tᴺ curve used to animate the ball's vertical position
 * during the final free-fall segment (last peg → bucket centre).
 *   1 → linear drop, constant speed (gravity disabled visually)
 *   2 → quadratic — natural-looking free-fall acceleration
 *   3 → cubic — dramatic pull, ball rockets into the bucket
 */
export const BALL_FREE_FALL_EXPONENT = 2;

/**
 * How far above the first peg the ball is placed at the start of the drop,
 * as a fraction of the vertical peg spacing.
 *   0.5 → drops from half a row above the first peg
 *   0.8 → drops from 80 % of a row above (current default, gives a visible fall-in)
 *   1.5 → drops from well above the board
 */
export const BALL_DROP_HEIGHT_FACTOR = 0.8;

/**
 * Ball radius relative to peg radius.  Both scale automatically with canvas
 * size and row count, so this ratio stays consistent at any resolution.
 *   0.6 → noticeably smaller than pegs
 *   1.0 → same size as pegs (default)
 *   1.4 → larger than pegs, more visible but may overlap neighbours
 */
export const BALL_RADIUS_FACTOR = 1.2;

// ─── Appearance ─────────────────────────────────────────────────────────────

/**
 * X and Y offset of the specular highlight circle, as a fraction of ball
 * radius.  Negative moves the highlight toward the upper-left, giving the
 * illusion of a light source above-left.
 *   0    → highlight centred on the ball (flat look)
 *  -0.25 → slight upper-left offset (default, subtle 3-D feel)
 *  -0.5  → strong upper-left offset (more pronounced shading)
 */
export const BALL_HIGHLIGHT_OFFSET = -0.25;

/**
 * Radius of the specular highlight circle as a fraction of ball radius.
 *   0.25 → small sharp highlight
 *   0.45 → medium highlight (default)
 *   0.65 → large soft highlight, covers most of the ball
 */
export const BALL_HIGHLIGHT_RADIUS = 0.45;

/**
 * Opacity of the specular highlight (0 = invisible, 1 = fully opaque).
 *   0.3 → very subtle shimmer
 *   0.6 → visible but not overpowering (default)
 *   1.0 → bright solid highlight
 */
export const BALL_HIGHLIGHT_ALPHA = 0.6;
