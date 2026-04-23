import { describe, it, expect } from 'vitest';
import { computeGeometry, pegPosition, bucketCenter } from '@/utils/geometry';
import {
  PAD_X, PAD_TOP, PAD_BOTTOM,
  MAX_PEG_SPACING_X, MAX_PEG_SPACING_Y,
  BUCKET_H, BUCKET_GAP,
} from '@/constants/layout';

const W = 500;
const H = 600;

describe('computeGeometry', () => {
  it('returns pegSpacingX bounded by MAX_PEG_SPACING_X', () => {
    // Very wide canvas — spacing should be capped
    const g = computeGeometry(2000, H, 8);
    expect(g.pegSpacingX).toBeLessThanOrEqual(MAX_PEG_SPACING_X);
  });

  it('returns pegSpacingY bounded by MAX_PEG_SPACING_Y', () => {
    // Very tall canvas — spacing should be capped
    const g = computeGeometry(W, 9000, 8);
    expect(g.pegSpacingY).toBeLessThanOrEqual(MAX_PEG_SPACING_Y);
  });

  it('originX is the horizontal center of the canvas', () => {
    const g = computeGeometry(W, H, 10);
    expect(g.originX).toBe(W / 2);
  });

  it('originY equals PAD_TOP', () => {
    const g = computeGeometry(W, H, 10);
    expect(g.originY).toBe(PAD_TOP);
  });

  it('bucketY is below the last peg row', () => {
    const rows = 10;
    const g = computeGeometry(W, H, rows);
    const expectedBucketY = g.originY + rows * g.pegSpacingY + BUCKET_GAP;
    expect(g.bucketY).toBeCloseTo(expectedBucketY, 5);
  });

  it('pegRadius is within [3, 6]', () => {
    for (const rows of [8, 10, 12, 16]) {
      const g = computeGeometry(W, H, rows);
      expect(g.pegRadius).toBeGreaterThanOrEqual(3);
      expect(g.pegRadius).toBeLessThanOrEqual(6);
    }
  });

  it('produces narrower spacing for more rows on the same canvas', () => {
    const g8  = computeGeometry(W, H, 8);
    const g16 = computeGeometry(W, H, 16);
    expect(g16.pegSpacingX).toBeLessThanOrEqual(g8.pegSpacingX);
  });
});

describe('pegPosition', () => {
  it('row-0, col-0 returns the origin', () => {
    const g = computeGeometry(W, H, 8);
    const pt = pegPosition(0, 0, g);
    expect(pt.x).toBe(g.originX);
    expect(pt.y).toBe(g.originY);
  });

  it('y increases by pegSpacingY for each row', () => {
    const g = computeGeometry(W, H, 10);
    for (let row = 0; row < 10; row++) {
      const pt = pegPosition(row, 0, g);
      expect(pt.y).toBeCloseTo(g.originY + row * g.pegSpacingY, 5);
    }
  });

  it('the grid is symmetric: col=0 and col=row are equidistant from center', () => {
    const g = computeGeometry(W, H, 10);
    const row = 6;
    const left  = pegPosition(row, 0, g);
    const right = pegPosition(row, row, g);
    expect(Math.abs(left.x - g.originX)).toBeCloseTo(Math.abs(right.x - g.originX), 5);
  });

  it('center column of each row lands exactly on originX', () => {
    const g = computeGeometry(W, H, 10);
    // For even-numbered rows, col = row/2 is the center column.
    const row = 4;
    const pt = pegPosition(row, row / 2, g);
    expect(pt.x).toBeCloseTo(g.originX, 5);
  });
});

describe('bucketCenter', () => {
  it('returns a point at y = bucketY + BUCKET_H / 2', () => {
    const rows = 10;
    const g = computeGeometry(W, H, rows);
    const pt = bucketCenter(0, rows, g);
    expect(pt.y).toBeCloseTo(g.bucketY + BUCKET_H / 2, 5);
  });

  it('leftmost bucket (bin=0) is to the left of center', () => {
    const rows = 10;
    const g = computeGeometry(W, H, rows);
    const pt = bucketCenter(0, rows, g);
    expect(pt.x).toBeLessThan(g.originX);
  });

  it('rightmost bucket (bin=rows) is to the right of center', () => {
    const rows = 10;
    const g = computeGeometry(W, H, rows);
    const pt = bucketCenter(rows, rows, g);
    expect(pt.x).toBeGreaterThan(g.originX);
  });

  it('middle bucket (bin=rows/2) is at center for even row counts', () => {
    const rows = 10;
    const g = computeGeometry(W, H, rows);
    const pt = bucketCenter(rows / 2, rows, g);
    expect(pt.x).toBeCloseTo(g.originX, 5);
  });

  it('adjacent buckets are exactly pegSpacingX apart', () => {
    const rows = 8;
    const g = computeGeometry(W, H, rows);
    for (let bin = 0; bin < rows; bin++) {
      const a = bucketCenter(bin, rows, g);
      const b = bucketCenter(bin + 1, rows, g);
      expect(b.x - a.x).toBeCloseTo(g.pegSpacingX, 5);
    }
  });

  it('there are rows+1 valid bucket positions', () => {
    const rows = 12;
    const g = computeGeometry(W, H, rows);
    const xs = Array.from({ length: rows + 1 }, (_, bin) => bucketCenter(bin, rows, g).x);
    // All x values should be unique and ascending
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]!);
    }
    expect(xs).toHaveLength(rows + 1);
  });
});
