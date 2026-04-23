import { defineStore } from 'pinia';
import { MULTIPLIERS } from '@/constants/multipliers';
import { ROWS_MIN, ROWS_MAX } from '@/constants/layout';
import { computePath } from '@/utils/physics';
import { round2 } from '@/utils/money';
import { GameState, isIdleGameState } from '@/types/plinko';
import type { RoundResult } from '@/types/plinko';

const MAX_HISTORY = 20;
const INITIAL_BALANCE = 1000;
const MIN_BET = 0.01;
const MAX_BALLS = 10;

export const usePlinkoStore = defineStore('plinko', {
  state: () => ({
    rows: ROWS_MIN,
    gameState: GameState.Idle,
    lastBin: null as number | null,

    balance: INITIAL_BALANCE,
    betAmount: 10,
    ballsPerDrop: 1,
    history: [] as RoundResult[],

    /** Tracks how many balls are still animating — used to defer idle transition. */
    _ballsInFlight: 0,
  }),

  getters: {
    multipliers: store => MULTIPLIERS[store.rows] ?? [],

    canDrop: (store): boolean =>
      isIdleGameState(store.gameState) &&
      store.betAmount >= MIN_BET &&
      round2(store.betAmount * store.ballsPerDrop) <= store.balance,
  },

  actions: {
    setRows(n: number) {
      if (!isIdleGameState(this.gameState)) return;
      this.rows = Math.max(ROWS_MIN, Math.min(ROWS_MAX, n));
    },

    setBetAmount(n: number) {
      const clamped = Math.max(MIN_BET, Math.min(this.balance, n));

      this.betAmount = round2(clamped);
    },

    setBallsPerDrop(n: number) {
      if (!isIdleGameState(this.gameState)) return;
      this.ballsPerDrop = Math.max(1, Math.min(MAX_BALLS, n));
    },

    /**
     * Validates, deducts the total bet, generates one path per ball.
     * Returns the array of paths so the board composable can spawn sprites.
     * Returns null when the drop is not allowed.
     */
    dropBall(): number[][] | null {
      if (!this.canDrop) return null;

      const totalBet = round2(this.betAmount * this.ballsPerDrop);

      this.balance        = round2(this.balance - totalBet);
      this.gameState      = GameState.Dropping;
      this._ballsInFlight = this.ballsPerDrop;

      const paths: number[][] = [];

      for (let i = 0; i < this.ballsPerDrop; i++) {
        paths.push(computePath(this.rows));
      }

      return paths;
    },

    /**
     * Called by the board composable when each ball sprite reaches its bucket.
     * Credits the payout, pushes to history, and transitions to idle only after
     * the LAST ball of a multi-ball drop has settled.
     */
    onBallLanded(bin: number): void {
      const mult   = MULTIPLIERS[this.rows]?.[bin] ?? 0;
      const payout = round2(this.betAmount * mult);

      this.balance = round2(this.balance + payout);
      this.lastBin = bin;

      const result: RoundResult = {
        bin,
        mult,
        bet: this.betAmount,
        payout,
        ts: Date.now(),
        roundSize: this.ballsPerDrop,
      };

      this.history.push(result);

      if (this.history.length > MAX_HISTORY) {
        this.history = this.history.slice(1);
      }

      this._ballsInFlight = Math.max(0, this._ballsInFlight - 1);

      if (this._ballsInFlight === 0) {
        this.gameState = GameState.Settling;
        this.gameState = GameState.Result;
        setTimeout(() => {
          if (this.gameState === GameState.Result) this.gameState = GameState.Idle;
        }, 300);
      }
    },
  },
});
