import { watch, onScopeDispose } from 'vue';
import { Application } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import type { ActiveBall, PegKey, Geometry } from '@/types/plinko';
import { createLayers } from '@/pixi/layers';
import type { Layers } from '@/pixi/layers';
import { drawBoard } from '@/pixi/drawBoard';
import type { BoardState } from '@/pixi/drawBoard';
import { computeGeometry, bucketCenter } from '@/utils/geometry';
import { buildWaypoints } from '@/utils/physics';
import { round2 } from '@/utils/money';
import { MULTIPLIERS } from '@/constants/multipliers';
import { buildBallTexture, createBall, createTrailGhosts, makeActiveBall, stepBall } from '@/pixi/ball';
import { BALL_SPAWN_DELAY_MS } from '@/constants/ball';
import { buildPegTextures, destroyPegTextures } from '@/pixi/pegTextures';
import type { PegTextures } from '@/pixi/pegTextures';
import { PegStateController } from '@/pixi/pegStates';
import { ParticleSystem } from '@/pixi/particles';
import { flashBucket, spawnWinText } from '@/pixi/effects';
import type { Texture } from 'pixi.js';

/**
 * Owns the PixiJS Application lifecycle, layers, ResizeObserver and reactive
 * watchers.  Also drives the ball animation loop via app.ticker.
 * Exposes mount() / unmount() which PlinkoCanvas.vue calls from
 * onMounted / onUnmounted.
 */
export function usePlinkoBoard() {
  const store = usePlinkoStore();

  let app: Application | null              = null;
  let layers: Layers | null               = null;
  let canvasResizeObserver: ResizeObserver | null = null;

  let pegTextures: PegTextures | null     = null;
  let ballTexture: Texture | null         = null;
  let boardState: BoardState | null       = null;
  let pegStates: PegStateController | null = null;
  let particleSystem: ParticleSystem | null = null;
  let currentGeometry: Geometry | null    = null;

  const activeBalls: ActiveBall[] = [];

  // ─── Peg key helper ────────────────────────────────────────────────────────

  /**
   * Builds the PegKey for each waypoint index in a ball's path.
   * Mirrors the col-accumulation logic in `buildWaypoints`.
   * Index 0 (drop point) and index rows+1 (bucket) map to null.
   */
  function buildPegKeys(path: number[], rows: number): Array<PegKey | null> {
    const keys: Array<PegKey | null> = [null]; // idx 0: drop point

    keys.push('0-0' as PegKey);                // idx 1: top peg (always row 0 col 0)

    let col = 0;

    for (let row = 1; row < rows; row++) {
      col += path[row - 1]!;
      keys.push(`${row}-${col}` as PegKey);    // idx row+1
    }
    keys.push(null); // idx rows+1: bucket

    return keys;
  }

  // ─── Spawn balls ───────────────────────────────────────────────────────────

  /** Spawns a ball sprite (+ trail ghosts) for each path returned by dropBall. */
  function spawnBalls(paths: number[][]) {
    if (!app || !layers || !ballTexture) return;

    const geometry = computeGeometry(app.screen.width, app.screen.height, store.rows);

    for (let i = 0; i < paths.length; i++) {
      const path      = paths[i]!;
      const waypoints = buildWaypoints(path, store.rows, geometry);
      const pegKeys   = buildPegKeys(path, store.rows);
      const finalBin  = path.reduce((s, v) => s + v, 0);
      const delayMs   = i * BALL_SPAWN_DELAY_MS;

      const sprite = createBall(geometry.ballRadius);

      sprite.x       = waypoints[0]!.x;
      sprite.y       = waypoints[0]!.y;
      sprite.visible = delayMs === 0;
      layers.ball.addChild(sprite);

      const trail = createTrailGhosts(ballTexture, geometry.ballRadius, layers.ball);

      activeBalls.push(makeActiveBall(sprite, trail, waypoints, pegKeys, finalBin, delayMs));
    }
  }

  // ─── Redraw ────────────────────────────────────────────────────────────────

  /** Redraws the board with current canvas dimensions. Re-generates all textures. */
  function redraw() {
    if (!app || !layers) return;

    const w = app.screen.width;
    const h = app.screen.height;

    currentGeometry = computeGeometry(w, h, store.rows);

    // Destroy stale GPU resources before regenerating.
    if (ballTexture) {
      ballTexture.destroy(true);
      ballTexture = null;
    }

    if (pegTextures) {
      destroyPegTextures(pegTextures);
      pegTextures = null;
    }

    ballTexture = buildBallTexture(app, currentGeometry.ballRadius);
    pegTextures = buildPegTextures(app, currentGeometry.pegRadius);

    boardState = drawBoard(layers, store.rows, w, h, store.multipliers, pegTextures);

    if (pegStates) {
      pegStates.rebind(boardState.pegSprites, pegTextures);
    }
    else {
      pegStates = new PegStateController(boardState.pegSprites, pegTextures);
    }
  }

  // ─── Ticker ────────────────────────────────────────────────────────────────

  /** Per-frame callback — steps all active balls and runs the effect sub-systems. */
  function tick(ticker: Ticker) {
    pegStates?.update(ticker.deltaMS);
    particleSystem?.update(ticker.deltaTime);

    for (let i = activeBalls.length - 1; i >= 0; i--) {
      const ball = activeBalls[i]!;

      // Count down spawn delay — keep the sprite hidden until it expires.
      if (ball.delayMs > 0) {
        ball.delayMs -= ticker.deltaMS;
        if (ball.delayMs <= 0) {
          ball.delayMs       = 0;
          ball.sprite.visible = true;
        }
        continue;
      }

      stepBall(
        ball,
        ticker.deltaTime,
        (p, wpIdx) => {
          // Peg hit: light up peg + spawn sparks
          const key = ball.pegKeys[wpIdx];
          if (key) pegStates?.setActive(key);
          particleSystem?.spawnHitSparks(p);
        },
        (bin) => {
          // Ball settled: flash bucket + floating win text + store update
          if (app && boardState && currentGeometry) {
            flashBucket(bin, app, boardState.bucketSprites);

            const mult   = MULTIPLIERS[store.rows]?.[bin] ?? 0;
            const payout = round2(store.betAmount * mult);
            const pos    = bucketCenter(bin, store.rows, currentGeometry);

            spawnWinText(payout, store.betAmount, pos, app, layers!.ui);
          }

          store.onBallLanded(bin);
        }
      );

      if (ball.settled) {
        // Clean up trail ghosts
        for (const ghost of ball.trail) {
          layers?.ball.removeChild(ghost);
          ghost.destroy();
        }
        layers?.ball.removeChild(ball.sprite);
        ball.sprite.destroy();
        activeBalls.splice(i, 1);
      }
    }
  }

  // ─── Mount / Unmount ───────────────────────────────────────────────────────

  /**
   * Initialise PixiJS, append the canvas to hostEl, set up watchers and the
   * drop-ball action subscription.  Call from onMounted().
   */
  async function mount(hostEl: HTMLDivElement) {
    app = new Application();

    await app.init({
      resizeTo: hostEl,
      background: 0x0b0b18,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio ?? 1,
    });

    hostEl.appendChild(app.canvas);
    (globalThis as Record<string, unknown>)['__PIXI_APP__'] = app;

    // Force a synchronous resize so app.screen reflects hostEl's actual
    // dimensions before the first draw.
    app.resize();

    layers = createLayers(app);

    // Particle system lives for the duration of the session.
    particleSystem = new ParticleSystem(app, layers.particles);

    redraw();

    app.ticker.add(tick);

    // Redraw on container resize (only when idle — no ball in flight).
    canvasResizeObserver = new ResizeObserver(() => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
    canvasResizeObserver.observe(hostEl);

    // Redraw on rows change (only when idle).
    watch(() => store.rows, () => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
  }

  /** Tear down PixiJS, GPU resources, and the ResizeObserver. */
  function unmount() {
    canvasResizeObserver?.disconnect();
    canvasResizeObserver = null;

    // Destroy any balls still in flight.
    for (const ball of activeBalls) {
      for (const ghost of ball.trail) ghost.destroy();
      ball.sprite.destroy();
    }
    activeBalls.length = 0;

    particleSystem?.destroy();
    particleSystem = null;

    if (pegTextures) {
      destroyPegTextures(pegTextures);
      pegTextures = null;
    }

    if (ballTexture) {
      ballTexture.destroy(true);
      ballTexture = null;
    }

    if (app) {
      app.ticker.remove(tick);
      app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true }
      );
      app = null;
    }

    layers      = null;
    boardState  = null;
    pegStates   = null;
    currentGeometry = null;
  }

  onScopeDispose(unmount);

  return { mount, unmount, spawnBalls };
}
