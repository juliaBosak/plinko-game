import { defineStore } from 'pinia';
import { MULTIPLIERS } from '@/constants/multipliers';
import { ROWS_MIN, ROWS_MAX } from '@/constants/layout';
import type { GameState } from '@/types/plinko';
import { isIdleGameState } from '@/types/plinko';

export const usePlinkoStore = defineStore('plinko', {
  state: () => ({
    rows: ROWS_MIN,
    gameState: 'idle' as GameState,
  }),

  getters: {
    multipliers: (store) => MULTIPLIERS[store.rows] ?? [],
  },

  actions: {
    setRows(n: number) {
      if (!isIdleGameState(this.gameState)) return;
      this.rows = Math.max(ROWS_MIN, Math.min(ROWS_MAX, n));
    },
  },
});
