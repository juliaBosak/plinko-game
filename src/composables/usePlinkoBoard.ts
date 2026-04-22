import { watch, onScopeDispose } from 'vue';
import { Application } from 'pixi.js';
import type { Ticker } from 'pixi.js';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import { createLayers } from '@/pixi/layers';
import { drawBoard } from '@/pixi/drawBoard';
import { computeGeometry } from '@/utils/geometry';
import { buildWaypoints } from '@/utils/physics';
import { createBall, makeActiveBall, stepBall } from '@/pixi/ball';
import type { ActiveBall } from '@/types/plinko';
import type { Layers } from '@/pixi/layers';

/**
 * Owns the PixiJS Application lifecycle, layers, ResizeObserver and reactive
 * watchers. Also drives the ball animation loop via app.ticker.
 * Exposes mount() / unmount() which PlinkoCanvas.vue calls from
 * onMounted / onUnmounted.
 */
export function usePlinkoBoard() {
  const store = usePlinkoStore();

  let app: Application | null    = null;
  let layers: Layers | null      = null;
  let ro: ResizeObserver | null  = null;
  let unsubAction: (() => void) | null = null;

  const activeBalls: ActiveBall[] = [];

  /** Redraw using current canvas dimensions from the renderer. */
  function redraw() {
    if (!app || !layers) return;
    drawBoard(
      layers,
      store.rows,
      app.screen.width,
      app.screen.height,
      store.multipliers,
    );
  }

  /** Per-frame ticker callback — steps every active ball and cleans up settled ones. */
  function tick(ticker: Ticker) {
    for (let i = activeBalls.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ball = activeBalls[i]!;

      stepBall(
        ball,
        ticker.deltaTime,
        (p, wp) => {
          // M2: log only — peg flash/sparks added in M4
          console.debug('peg hit', wp, p);
        },
        (bin) => {
          store.onBallLanded(bin);
        },
      );

      if (ball.settled) {
        layers?.ball.removeChild(ball.sprite);
        ball.sprite.destroy();
        activeBalls.splice(i, 1);
      }
    }
  }

  /**
   * Mount: initialise PixiJS, append the canvas to hostEl, set up watchers
   * and the drop-ball action subscription.
   * Call from onMounted().
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

    redraw();

    // Ticker loop for ball animation
    app.ticker.add(tick);

    // Spawn a ball whenever dropBall() is called on the store
    unsubAction = store.$onAction(({ name, after }) => {
      if (name !== 'dropBall') return;
      after((path) => {
        if (!path || !app || !layers) return;
        const g         = computeGeometry(app.screen.width, app.screen.height, store.rows);
        const waypoints = buildWaypoints(path, store.rows, g);
        const finalBin  = path.reduce((s, v) => s + v, 0);

        const sprite = createBall(g.ballRadius);
        // buildWaypoints always produces rows+2 points (rows ≥ 8), so index 0 is safe
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sprite.x = waypoints[0]!.x;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        sprite.y = waypoints[0]!.y;
        layers.ball.addChild(sprite);

        activeBalls.push(makeActiveBall(sprite, waypoints, finalBin));
      });
    });

    // Redraw whenever the container resizes (only when idle — no ball in flight)
    ro = new ResizeObserver(() => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
    ro.observe(hostEl);

    // Redraw whenever rows change (only when idle)
    watch(() => store.rows, () => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
  }

  /** Unmount: tear down Pixi, ResizeObserver, and action subscription. */
  function unmount() {
    unsubAction?.();
    unsubAction = null;

    ro?.disconnect();
    ro = null;

    // Destroy any balls still in flight
    for (const ball of activeBalls) {
      ball.sprite.destroy();
    }
    activeBalls.length = 0;

    if (app) {
      app.ticker.remove(tick);
      app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true },
      );
      app = null;
    }
    layers = null;
  }

  onScopeDispose(unmount);

  return { mount, unmount };
}
