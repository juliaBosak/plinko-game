import { Container } from 'pixi.js';
import type { Application } from 'pixi.js';

export interface Layers {
  pegs: Container
  buckets: Container
  ball: Container
  particles: Container
  ui: Container
}

/**
 * Creates the five named render layers and appends them to app.stage in the
 * correct z-order.  Call once after app.init() resolves.
 */
export function createLayers(app: Application): Layers {
  const pegs      = new Container({ isRenderGroup: true });
  const buckets   = new Container();
  const ball      = new Container();
  const particles = new Container({ isRenderGroup: true });
  const ui        = new Container();

  app.stage.addChild(pegs, buckets, ball, particles, ui);

  return { pegs, buckets, ball, particles, ui };
}
