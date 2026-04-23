import { Text, TextStyle } from 'pixi.js';
import type { Application, Graphics, Container, Ticker } from 'pixi.js';
import type { Point } from '@/types/plinko';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Linear interpolation between two packed RGB hex colours. */
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;

  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8)  |
     Math.round(ab + (bb - ab) * t)
  );
}

// ─── Bucket flash ─────────────────────────────────────────────────────────────

const FLASH_DURATION = 300; // ms

/**
 * Tweens the bucket box at `bin` from its current tint → white → original tint
 * over 300 ms.  The boxes must be drawn with a white fill + tint (as done in
 * drawBoard) so that setting `tint = 0xffffff` produces a pure-white flash.
 */
export function flashBucket(
  bin: number,
  app: Application,
  bucketSprites: Graphics[]
): void {
  const box = bucketSprites[bin];
  if (!box) return;

  const originalTint = box.tint as unknown as number;
  let elapsed = 0;

  function tween(ticker: Ticker): void {
    elapsed += ticker.deltaMS;

    const t = Math.min(elapsed / FLASH_DURATION, 1);
    // Triangle wave: 0 → 1 → 0 so the flash peaks at mid-point then fades back.
    const flash = t < 0.5 ? t * 2 : 2 - t * 2;

    box.tint = lerpColor(originalTint, 0xffffff, flash);

    if (t >= 1) {
      box.tint = originalTint;
      app.ticker.remove(tween);
    }
  }

  app.ticker.add(tween);
}

// ─── Win text ─────────────────────────────────────────────────────────────────

const WIN_STYLE = new TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontWeight: '700',
  fontSize: 18,
  fill: 0x4ade80,
});

const LOSS_STYLE = new TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontWeight: '700',
  fontSize: 18,
  fill: 0xff6b6b,
});

const PUSH_STYLE = new TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontWeight: '700',
  fontSize: 18,
  fill: 0xffffff,
});

function pickStyle(payout: number, bet: number): TextStyle {
  if (payout > bet)  return WIN_STYLE;
  if (payout < bet)  return LOSS_STYLE;

  return PUSH_STYLE;
}

/**
 * Spawns a floating "+$X.XX" / "-$X.XX" label above the winning bucket.
 * The text floats upward and fades out over 1.2 s then destroys itself.
 */
export function spawnWinText(
  payout: number,
  bet: number,
  pos: Point,
  app: Application,
  uiLayer: Container
): void {
  const sign  = payout > bet ? '+' : '';
  const label = `${sign}$${payout.toFixed(2)}`;

  const text = new Text({
    text: label,
    style: pickStyle(payout, bet),
  });

  text.anchor.set(0.5);
  text.x = pos.x;
  text.y = pos.y - 20;
  uiLayer.addChild(text);

  let life = 1.0;

  function anim(ticker: Ticker): void {
    life    -= 0.012 * ticker.deltaTime;
    text.y  -= 1.2 * ticker.deltaTime;
    text.alpha = Math.max(0, life);

    if (life <= 0) {
      uiLayer.removeChild(text);
      text.destroy();
      app.ticker.remove(anim);
    }
  }

  app.ticker.add(anim);
}
