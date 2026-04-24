import { Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { computeGeometry, pegPosition, bucketCenter } from '@/utils/geometry';
import { BUCKET_H } from '@/constants/layout';
import {
  BUCKET_JACKPOT, BUCKET_HIGH, BUCKET_MEDIUM, BUCKET_LOW, BUCKET_LOSS,
} from '@/constants/colors';
import type { Layers } from './layers';
import type { PegTextures } from './pegTextures';
import type { PegKey } from '@/types/plinko';

export interface BoardState {
  /** All peg Sprites keyed by "row-col". Passed to PegStateController. */
  pegSprites: Map<PegKey, Sprite>;
  /** One Graphics box per bin (index 0 = leftmost bucket). Used for flash tween. */
  bucketSprites: Graphics[];
  /** Original tint colour for each bucket box. Used to restore after flash. */
  bucketColors: number[];
}

function bucketColor(mult: number): number {
  if (mult >= 10) return BUCKET_JACKPOT;
  if (mult >= 5)  return BUCKET_HIGH;
  if (mult >= 2)  return BUCKET_MEDIUM;
  if (mult >= 1)  return BUCKET_LOW;

  return BUCKET_LOSS;
}

function formatMult(mult: number): string {
  return `${mult}×`;
}

/**
 * Clears and redraws the static board geometry — background spotlight, peg grid,
 * and the multiplier bucket strip — then returns references to every peg Sprite
 * and bucket Graphics so the effects layer can animate them.
 *
 * Pegs are now `Sprite`s whose `.texture` can be swapped cheaply by
 * `PegStateController` instead of re-drawing `Graphics` every frame.
 *
 * Buckets are drawn with a white fill + colour `tint` so that the flash tween
 * can animate `.tint` from the original colour → white → original colour.
 */
export function drawBoard(
  layers: Layers,
  rows: number,
  canvasW: number,
  canvasH: number,
  multipliers: number[],
  pegTextures: PegTextures
): BoardState {
  const geometry = computeGeometry(canvasW, canvasH, rows);

  // ── Pegs ─────────────────────────────────────────────────────────────────
  layers.pegs.removeChildren().forEach(c => c.destroy());

  const pegSprites = new Map<PegKey, Sprite>();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const pos    = pegPosition(row, col, geometry);
      const sprite = new Sprite(pegTextures.default);

      sprite.anchor.set(0.5);
      sprite.x = pos.x;
      sprite.y = pos.y;
      layers.pegs.addChild(sprite);

      pegSprites.set(`${row}-${col}` as PegKey, sprite);
    }
  }

  // ── Multiplier bucket strip ───────────────────────────────────────────────
  layers.buckets.removeChildren().forEach(c => c.destroy());

  const bucketW      = geometry.pegSpacingX - 4;
  const fontSize     = Math.max(8, Math.min(13, bucketW * 0.28));
  const bucketRadius = 5;

  const labelStyle = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontWeight: '700',
    fontSize,
    fill: 0xffffff,
  });

  const bucketSprites: Graphics[] = [];
  const bucketColors: number[]    = [];

  for (let bin = 0; bin <= rows; bin++) {
    const center = bucketCenter(bin, rows, geometry);
    const x      = center.x - bucketW / 2;
    const y      = geometry.bucketY;
    const color  = bucketColor(multipliers[bin] ?? 0);

    // White fill + tint so the flash tween can lerp .tint → 0xffffff and back.
    const box = new Graphics();

    box.roundRect(x, y, bucketW, BUCKET_H, bucketRadius).fill({ color: 0xffffff });
    box.tint = color;
    layers.buckets.addChild(box);
    bucketSprites.push(box);
    bucketColors.push(color);

    const label = new Text({ text: formatMult(multipliers[bin] ?? 0), style: labelStyle });

    label.anchor.set(0.5, 0.5);
    label.x = center.x;
    label.y = center.y;
    layers.buckets.addChild(label);
  }

  return { pegSprites, bucketSprites, bucketColors };
}
