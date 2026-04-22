import { defineStore } from 'pinia';
import { MULTIPLIERS } from '@/constants/multipliers';
import { ROWS_MIN, ROWS_MAX } from '@/constants/layout';
import { computePath } from '@/utils/physics';
import { GameState, isIdleGameState } from '@/types/plinko';

export const usePlinkoStore = defineStore('plinko', {
  state: () => ({
    rows:      ROWS_MIN,
    gameState: GameState.Idle,
    lastBin:   null as number | null,
  }),

  getters: {
    multipliers: (store) => MULTIPLIERS[store.rows] ?? [],
  },

  actions: {
    setRows(n: number) {
      if (!isIdleGameState(this.gameState)) return;
      this.rows = Math.max(ROWS_MIN, Math.min(ROWS_MAX, n));
    },

    /**
     * Transitions from idle → dropping and returns the generated path so the
     * board composable can build waypoints and spawn the ball sprite.
     * Returns null when a drop is already in progress.
     */
    dropBall(): number[] | null {
      if (!isIdleGameState(this.gameState)) return null;
      this.gameState = GameState.Dropping;
      const path = computePath(this.rows);
      this.lastBin = path.reduce((sum, v) => sum + v, 0);
      return path;
    },

    /**
     * Called by the board composable when the ball sprite reaches its bucket.
     * Drives the state machine through settling → result → idle (.5 s delay).
     */
    onBallLanded(bin: number): void {
      this.lastBin   = bin;
      this.gameState = GameState.Settling;
      this.gameState = GameState.Result;
      setTimeout(() => {
        if (this.gameState === GameState.Result) this.gameState = GameState.Idle;
      }, 500);
    },
  },
});
