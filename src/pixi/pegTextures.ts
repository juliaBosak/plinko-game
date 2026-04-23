import { Graphics } from 'pixi.js';
import type { Application, Texture } from 'pixi.js';
import {
  PEG_DEFAULT, PEG_INNER,
  PEG_ACTIVE, PEG_HIT_BLUE, PEG_HIT_GREEN,
} from '@/constants/colors';

export interface PegTextures {
  default: Texture;
  active: Texture;
  hitBlue: Texture;
  hitGreen: Texture;
}

/** Draws a plain peg (no glow). */
function makeDefaultGraphics(r: number): Graphics {
  const g = new Graphics();

  g.circle(0, 0, r).fill({ color: PEG_DEFAULT });
  g.circle(-r * 0.15, -r * 0.15, r * 0.55).fill({ color: PEG_INNER, alpha: 0.75 });

  return g;
}

/**
 * Draws a glowing peg with two outer alpha rings baked in.
 * The extra ring radii (×1.5, ×2.0) mean the glow texture is naturally larger
 * than the default one — switching textures on a Sprite extends the glow outward
 * from the peg centre, which is exactly what we want.
 */
function makeGlowGraphics(baseColor: number, r: number): Graphics {
  const g = new Graphics();

  g.circle(0, 0, r * 2.0).fill({ color: baseColor, alpha: 0.08 });
  g.circle(0, 0, r * 1.5).fill({ color: baseColor, alpha: 0.22 });
  g.circle(0, 0, r).fill({ color: baseColor });
  g.circle(-r * 0.15, -r * 0.15, r * 0.55).fill({ color: PEG_INNER, alpha: 0.75 });

  return g;
}

/**
 * Pre-renders all four peg states into GPU textures.
 * Call once per `drawBoard()` invocation (i.e. whenever `rows` or canvas size changes).
 * Always call `destroyPegTextures` on the previous set before calling this.
 */
export function buildPegTextures(app: Application, pegRadius: number): PegTextures {
  // Padding must be large enough to include the outermost glow ring (r × 2.0).
  const padding = Math.ceil(pegRadius * 2.0) + 2;
  const opts = { padding };

  const g0 = makeDefaultGraphics(pegRadius);
  const g1 = makeGlowGraphics(PEG_ACTIVE,    pegRadius);
  const g2 = makeGlowGraphics(PEG_HIT_BLUE,  pegRadius);
  const g3 = makeGlowGraphics(PEG_HIT_GREEN, pegRadius);

  const textures: PegTextures = {
    default: app.renderer.generateTexture({ target: g0, ...opts }),
    active: app.renderer.generateTexture({ target: g1, ...opts }),
    hitBlue: app.renderer.generateTexture({ target: g2, ...opts }),
    hitGreen: app.renderer.generateTexture({ target: g3, ...opts }),
  };

  g0.destroy();
  g1.destroy();
  g2.destroy();
  g3.destroy();

  return textures;
}

/** Releases GPU memory for all four peg textures. Call before regenerating. */
export function destroyPegTextures(t: PegTextures): void {
  t.default.destroy(true);
  t.active.destroy(true);
  t.hitBlue.destroy(true);
  t.hitGreen.destroy(true);
}
