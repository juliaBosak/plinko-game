import { describe, it, expect, vi } from 'vitest';
import { computePath, buildWaypoints, easeInOutQuad, lerp } from '@/utils/physics';
import type { Geometry } from '@/types/plinko';

// Geometry fixture that is self-consistent with the layout formula:
// bucketY = originY + rows * pegSpacingY + BUCKET_GAP
// We size it for up to 16 rows so all tests stay valid.
const ROWS_FIXTURE = 16;
const ORIGIN_Y = 40;
const PEG_SPACING_Y = 50;
const BUCKET_GAP_FIXTURE = 8;

const G: Geometry = {
  originX: 250,
  originY: ORIGIN_Y,
  pegSpacingX: 40,
  pegSpacingY: PEG_SPACING_Y,
  pegRadius: 5,
  ballRadius: 12,
  bucketY: ORIGIN_Y + ROWS_FIXTURE * PEG_SPACING_Y + BUCKET_GAP_FIXTURE, // 848
};

describe('computePath', () => {
  it('returns an array of length equal to rows', () => {
    for (const rows of [8, 10, 12, 16]) {
      expect(computePath(rows)).toHaveLength(rows);
    }
  });

  it('contains only 0s and 1s', () => {
    const path = computePath(16);

    expect(path.every(v => v === 0 || v === 1)).toBe(true);
  });

  it('produces all zeros when Math.random always returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(computePath(8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    vi.restoreAllMocks();
  });

  it('produces all ones when Math.random always returns 0.9', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    expect(computePath(8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    vi.restoreAllMocks();
  });

  it('final bin (sum of path) is always within 0..rows', () => {
    for (let i = 0; i < 50; i++) {
      const rows = 12;
      const path = computePath(rows);
      const bin = path.reduce((a, b) => a + b, 0);

      expect(bin).toBeGreaterThanOrEqual(0);
      expect(bin).toBeLessThanOrEqual(rows);
    }
  });
});

describe('buildWaypoints', () => {
  it('returns rows + 2 waypoints', () => {
    for (const rows of [8, 10, 12, 16]) {
      const path = Array(rows).fill(0);

      expect(buildWaypoints(path, rows, G)).toHaveLength(rows + 2);
    }
  });

  it('first waypoint is the drop point above origin', () => {
    const rows = 8;
    const pts = buildWaypoints(Array(rows).fill(0), rows, G);

    expect(pts[0]!.x).toBe(G.originX);
    expect(pts[0]!.y).toBe(G.originY - G.pegSpacingY * 0.8);
  });

  it('all-left path ends at the leftmost bucket center x', () => {
    const rows = 8;
    const path = Array(rows).fill(0);
    const pts = buildWaypoints(path, rows, G);
    const last = pts[pts.length - 1]!;
    // bin 0 → x = originX + (0 - rows/2) * pegSpacingX
    const expectedX = G.originX + (0 - rows / 2) * G.pegSpacingX;

    expect(last.x).toBeCloseTo(expectedX, 5);
  });

  it('all-right path ends at the rightmost bucket center x', () => {
    const rows = 8;
    const path = Array(rows).fill(1);
    const pts = buildWaypoints(path, rows, G);
    const last = pts[pts.length - 1]!;
    // bin rows → x = originX + (rows - rows/2) * pegSpacingX
    const expectedX = G.originX + (rows - rows / 2) * G.pegSpacingX;

    expect(last.x).toBeCloseTo(expectedX, 5);
  });

  it('waypoints are monotonically increasing in y (ball falls)', () => {
    const rows = 10;
    const path = Array(rows).fill(0);
    const pts = buildWaypoints(path, rows, G);

    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]!.y).toBeGreaterThan(pts[i - 1]!.y);
    }
  });
});

describe('easeInOutQuad', () => {
  it('returns 0 at t=0', () => expect(easeInOutQuad(0)).toBe(0));
  it('returns 1 at t=1', () => expect(easeInOutQuad(1)).toBe(1));
  it('returns 0.5 at t=0.5', () => expect(easeInOutQuad(0.5)).toBe(0.5));

  it('is symmetric around 0.5', () => {
    const t = 0.3;

    expect(easeInOutQuad(t)).toBeCloseTo(1 - easeInOutQuad(1 - t), 10);
  });

  it('is always in range [0, 1] for t in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const v = easeInOutQuad(t);

      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => expect(lerp(10, 20, 0)).toBe(10));
  it('returns b at t=1', () => expect(lerp(10, 20, 1)).toBe(20));
  it('returns midpoint at t=0.5', () => expect(lerp(10, 20, 0.5)).toBe(15));
  it('works with negative values', () => expect(lerp(-10, 10, 0.5)).toBe(0));
  it('works when a > b', () => expect(lerp(100, 0, 0.25)).toBe(75));
});
