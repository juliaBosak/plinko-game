import { Graphics, ParticleContainer, Particle, Rectangle } from 'pixi.js';
import type { Application, Texture, Container } from 'pixi.js';
import type { Point } from '@/types/plinko';

interface LiveParticle {
  particle: Particle;
  vx: number;
  vy: number;
  life: number;  // 1 → 0
  decay: number; // life reduction per normalised frame
}

const POOL_SIZE     = 256;
const SPARK_RADIUS  = 2.5;
const GRAVITY       = 0.12; // px per normalised frame²

function buildSparkTexture(app: Application): Texture {
  const g = new Graphics();

  g.circle(0, 0, SPARK_RADIUS).fill({ color: 0xffffff });

  const tex = app.renderer.generateTexture({ target: g, padding: 1 });

  g.destroy();

  return tex;
}

/**
 * Pooled spark particle system.
 *
 * Usage:
 *   const sys = new ParticleSystem(app, layers.particles);
 *   // each frame:
 *   sys.update(ticker.deltaTime);
 *   // on peg hit:
 *   sys.spawnHitSparks(pos);
 *   // on unmount:
 *   sys.destroy();
 */
export class ParticleSystem {
  private readonly _texture: Texture;
  private readonly _container: ParticleContainer;
  private readonly _pool: Particle[];
  private readonly _active: LiveParticle[] = [];

  constructor(app: Application, parentLayer: Container) {
    this._texture = buildSparkTexture(app);

    // Use a very large boundsArea so the container is never culled.
    this._container = new ParticleContainer({
      texture: this._texture,
      boundsArea: new Rectangle(-2000, -2000, 8000, 8000),
      dynamicProperties: {
        position: true,
        color: true,
        vertex: true,
      },
    });
    parentLayer.addChild(this._container);

    // Pre-allocate the pool so no GC churn mid-game.
    this._pool = Array.from({ length: POOL_SIZE }, () =>
      new Particle({
        texture: this._texture,
        anchorX: 0.5,
        anchorY: 0.5,
      })
    );
  }

  /** Emit 4–6 sparks radiating outward from `pos`. */
  spawnHitSparks(pos: Point): void {
    const count = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const p = this._pool.pop();
      if (!p) break; // pool exhausted — skip rather than allocate

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;

      p.x      = pos.x;
      p.y      = pos.y;
      p.alpha  = 1;
      p.scaleX = 1;
      p.scaleY = 1;

      this._container.addParticle(p);
      this._active.push({
        particle: p,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.07 + Math.random() * 0.04,
      });
    }
  }

  /**
   * Advance all active particles.
   * Call every frame with `ticker.deltaTime` (60-fps-normalised delta).
   */
  update(deltaTime: number): void {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const lp = this._active[i]!;

      lp.life -= lp.decay * deltaTime;

      if (lp.life <= 0) {
        this._container.removeParticle(lp.particle);
        this._pool.push(lp.particle);
        this._active.splice(i, 1);
        continue;
      }

      lp.particle.x  += lp.vx * deltaTime;
      lp.particle.y  += lp.vy * deltaTime;
      lp.vy          += GRAVITY * deltaTime;

      lp.particle.alpha  = lp.life;

      const s = Math.max(0.05, lp.life * 0.8);

      lp.particle.scaleX = s;
      lp.particle.scaleY = s;
    }
  }

  /** Remove all active particles and release the GPU texture. */
  destroy(): void {
    this._container.removeParticles();
    this._active.length = 0;
    this._texture.destroy(true);
  }
}
