import { Graphics, Text, TextStyle } from 'pixi.js';
import { computeGeometry, pegPosition, bucketCenter } from '@/utils/geometry';
import { BUCKET_H } from '@/constants/layout';
import {
  PEG_DEFAULT, PEG_INNER,
  BUCKET_JACKPOT, BUCKET_HIGH, BUCKET_MEDIUM, BUCKET_LOW, BUCKET_LOSS,
} from '@/constants/colors';
import type { Layers } from './layers';

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
 * Clears and redraws the static board geometry: background spotlight, peg grid,
 * and the multiplier bucket strip aligned exactly under the last peg row.
 */
export function drawBoard(
  layers: Layers,
  rows: number,
  canvasW: number,
  canvasH: number,
  multipliers: number[],
): void {
  const geometry = computeGeometry(canvasW, canvasH, rows);

  // ── Pegs ─────────────────────────────────────────────────────────────────
  layers.pegs.removeChildren().forEach((c) => c.destroy());

  const pegRadius = geometry.pegRadius;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      const pos = pegPosition(row, col, geometry);
      const peg = new Graphics();

      peg.circle(0, 0, pegRadius).fill({ color: PEG_DEFAULT });
      peg.circle(-pegRadius * 0.15, -pegRadius * 0.15, pegRadius * 0.55).fill({ color: PEG_INNER, alpha: 0.75 });
      peg.x = pos.x;
      peg.y = pos.y;
      layers.pegs.addChild(peg);
    }
  }

  // ── Multiplier bucket strip ───────────────────────────────────────────────
  layers.buckets.removeChildren().forEach((c) => c.destroy());

  // Each bucket is pegSpacingX wide with a 2 px gap on each side.
  const bucketW  = geometry.pegSpacingX - 4;
  const fontSize = Math.max(7, Math.min(13, bucketW * 0.28));
  const bucketRadius   = 5;

  const labelStyle = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontWeight: '700',
    fontSize,
    fill: 0xffffff,
  });

  for (let bin = 0; bin <= rows; bin++) {
    const center = bucketCenter(bin, rows, geometry);
    const x = center.x - bucketW / 2;
    const y = geometry.bucketY;

    const box = new Graphics();
    box.roundRect(x, y, bucketW, BUCKET_H, bucketRadius)
       .fill({ color: bucketColor(multipliers[bin] ?? 0) });
    layers.buckets.addChild(box);

    const label = new Text({ text: formatMult(multipliers[bin] ?? 0), style: labelStyle });
    label.anchor.set(0.5, 0.5);
    label.x = center.x;
    label.y = center.y;
    layers.buckets.addChild(label);
  }
}
