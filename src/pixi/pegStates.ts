import type { Sprite } from 'pixi.js';
import type { PegKey } from '@/types/plinko';
import type { PegTextures } from './pegTextures';

type PegState = 'default' | 'active' | 'hitBlue' | 'hitGreen';

interface PegEntry {
  sprite: Sprite;
  state: PegState;
  elapsed: number; // ms elapsed in the current state
}

// Timing thresholds (milliseconds)
const ACTIVE_DURATION    = 80;   // gold → blue  (roughly 1 frame at 60 fps + margin)
const HIT_BLUE_DURATION  = 600;  // blue  → green
const HIT_GREEN_DURATION = 900;  // green → default  (total lifetime ≈ 1 580 ms)

/**
 * Manages per-peg visual state for the whole board.
 *
 * Workflow:
 *   1. Construct with the peg-sprite map returned by `drawBoard`.
 *   2. Call `setActive(key)` each time a ball arrives at a peg.
 *   3. Call `update(deltaMS)` every frame — it auto-decays active→blue→green→default.
 *   4. Call `rebind(pegs, textures)` after a board redraw (new rows / canvas resize).
 *   5. Call `clearAll()` to reset all pegs immediately (e.g. after a game round ends).
 */
export class PegStateController {
  private _pegs: Map<PegKey, PegEntry>;
  private _textures: PegTextures;

  constructor(pegs: Map<PegKey, Sprite>, textures: PegTextures) {
    this._textures = textures;
    this._pegs = new Map();

    for (const [key, sprite] of pegs) {
      this._pegs.set(key, { sprite, state: 'default', elapsed: 0 });
    }
  }

  /** Flash a peg gold immediately; auto-decays to blue → green → default. */
  setActive(key: PegKey): void {
    const entry = this._pegs.get(key);
    if (!entry) return;
    entry.state   = 'active';
    entry.elapsed = 0;
    entry.sprite.texture = this._textures.active;
  }

  /** Force a peg directly to hit-blue; auto-decays to green → default. */
  setHitBlue(key: PegKey): void {
    const entry = this._pegs.get(key);
    if (!entry) return;
    entry.state   = 'hitBlue';
    entry.elapsed = 0;
    entry.sprite.texture = this._textures.hitBlue;
  }

  /** Instantly reset every non-default peg back to default. */
  clearAll(): void {
    for (const entry of this._pegs.values()) {
      if (entry.state === 'default') continue;
      entry.state   = 'default';
      entry.elapsed = 0;
      entry.sprite.texture = this._textures.default;
    }
  }

  /**
   * Re-register all peg sprites and textures after a board redraw.
   * Old peg sprites are discarded; new ones replace them.
   */
  rebind(pegs: Map<PegKey, Sprite>, textures: PegTextures): void {
    this._textures = textures;
    this._pegs.clear();

    for (const [key, sprite] of pegs) {
      this._pegs.set(key, { sprite, state: 'default', elapsed: 0 });
    }
  }

  /** Advance all peg state timers. Call once per ticker frame with `ticker.deltaMS`. */
  update(deltaMS: number): void {
    for (const entry of this._pegs.values()) {
      if (entry.state === 'default') continue;

      entry.elapsed += deltaMS;

      if (entry.state === 'active' && entry.elapsed >= ACTIVE_DURATION) {
        entry.state   = 'hitBlue';
        entry.elapsed = 0;
        entry.sprite.texture = this._textures.hitBlue;
      }
      else if (entry.state === 'hitBlue' && entry.elapsed >= HIT_BLUE_DURATION) {
        entry.state   = 'hitGreen';
        entry.elapsed = 0;
        entry.sprite.texture = this._textures.hitGreen;
      }
      else if (entry.state === 'hitGreen' && entry.elapsed >= HIT_GREEN_DURATION) {
        entry.state   = 'default';
        entry.elapsed = 0;
        entry.sprite.texture = this._textures.default;
      }
    }
  }
}
