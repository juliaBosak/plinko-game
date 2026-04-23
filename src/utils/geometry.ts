import {
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  MAX_PEG_SPACING_X,
  MAX_PEG_SPACING_Y,
  BUCKET_H, BUCKET_GAP,
} from '@/constants/layout';
import { BALL_RADIUS_FACTOR } from '@/constants/ball';
import type { Geometry, Point } from '@/types/plinko';

/**
 * Compute all board geometry constants from current canvas dimensions and row count.
 *
 * The canvas height is treated as fixed (500 px by default).  Peg spacing is
 * derived so that every row fits inside the available vertical space above the
 * multiplier bucket strip, and so the grid never stretches horizontally beyond
 * MAX_PEG_SPACING_X. The grid is always centred.
 */
export function computeGeometry(canvasW: number, canvasH: number, rows: number): Geometry {
  const pegSpacingX = Math.min((canvasW - PAD_X * 2) / (rows + 1), MAX_PEG_SPACING_X);

  // Vertical space available for the peg grid (below PAD_TOP, above bucket strip).
  const availH     = canvasH - PAD_TOP - BUCKET_GAP - BUCKET_H - PAD_BOTTOM;
  const pegSpacingY = Math.min(availH / rows, MAX_PEG_SPACING_Y);

  const pegRadius  = Math.max(3, Math.min(6, pegSpacingX * 0.18));
  const ballRadius = pegRadius * BALL_RADIUS_FACTOR;

  const originX = canvasW / 2;
  const originY = PAD_TOP;

  // Y of the top edge of the bucket row.
  const bucketY = originY + rows * pegSpacingY + BUCKET_GAP;

  return { pegSpacingX, pegSpacingY, pegRadius, ballRadius, originX, originY, bucketY };
}

/**
 * Canvas position of peg at (row, col).
 * Row 0 has 1 peg (col 0), row i has i+1 pegs (col 0..i).
 */
export function pegPosition(row: number, col: number, g: Geometry): Point {
  return {
    x: g.originX + (col - row / 2) * g.pegSpacingX,
    y: g.originY + row * g.pegSpacingY,
  };
}

/**
 * Centre of multiplier bucket slot `bin` (0 = leftmost, rows = rightmost).
 * There are always rows+1 bins, each pegSpacingX wide, centred under the
 * corresponding gap in the last peg row.
 */
export function bucketCenter(bin: number, rows: number, g: Geometry): Point {
  return {
    x: g.originX + (bin - rows / 2) * g.pegSpacingX,
    y: g.bucketY + BUCKET_H / 2,
  };
}
