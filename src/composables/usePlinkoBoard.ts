import { watch, onScopeDispose } from 'vue';
import { Application } from 'pixi.js';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import { createLayers } from '@/pixi/layers';
import { drawBoard } from '@/pixi/drawBoard';
import type { Layers } from '@/pixi/layers';

/**
 * Owns the PixiJS Application lifecycle, layers, ResizeObserver and reactive
 * watchers needed for M1 (static board).  Exposes mount() / unmount() which
 * PlinkoCanvas.vue calls from onMounted / onUnmounted.
 */
export function usePlinkoBoard() {
  const store = usePlinkoStore();

  let app: Application | null = null;
  let layers: Layers | null   = null;
  let ro: ResizeObserver | null = null;

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

  /**
   * Mount: initialise PixiJS, append the canvas to hostEl, set up watchers.
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

    globalThis.__PIXI_APP__ = app;

    // Force a synchronous resize so app.screen reflects hostEl's actual
    // dimensions before the first draw.  Without this the ResizePlugin may
    // not have fired yet and app.screen would still hold stale defaults.
    app.resize();

    layers = createLayers(app);

    // Initial draw
    redraw();

    // Redraw whenever the container resizes (guarded — no ball in M1)
    ro = new ResizeObserver(() => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
    ro.observe(hostEl);

    // Redraw whenever rows change
    watch(() => store.rows, () => {
      if (!isIdleGameState(store.gameState)) return;
      redraw();
    });
  }

  /** Unmount: tear down Pixi and ResizeObserver. Call from onUnmounted(). */
  function unmount() {
    ro?.disconnect();
    ro = null;

    if (app) {
      app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true }
      );
      app = null;
    }
    layers = null;
  }

  // Auto-cleanup when the owning Vue scope is disposed
  onScopeDispose(unmount);

  return { mount, unmount };
}
