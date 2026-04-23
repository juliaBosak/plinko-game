import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { GameState } from '@/types/plinko';
import { MULTIPLIERS } from '@/constants/multipliers';
import { ROWS_MIN, ROWS_MAX } from '@/constants/layout';

describe('plinkoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with Idle game state', () => {
      const store = usePlinkoStore();
      expect(store.gameState).toBe(GameState.Idle);
    });

    it('starts at ROWS_MIN rows', () => {
      const store = usePlinkoStore();
      expect(store.rows).toBe(ROWS_MIN);
    });

    it('starts with $1000 balance', () => {
      const store = usePlinkoStore();
      expect(store.balance).toBe(1000);
    });

    it('starts with $10 bet amount', () => {
      const store = usePlinkoStore();
      expect(store.betAmount).toBe(10);
    });

    it('starts with 1 ball per drop', () => {
      const store = usePlinkoStore();
      expect(store.ballsPerDrop).toBe(1);
    });

    it('starts with empty history', () => {
      const store = usePlinkoStore();
      expect(store.history).toHaveLength(0);
    });

    it('starts with null lastBin', () => {
      const store = usePlinkoStore();
      expect(store.lastBin).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  describe('multipliers getter', () => {
    it('returns the multiplier array for the current row count', () => {
      const store = usePlinkoStore();
      expect(store.multipliers).toEqual(MULTIPLIERS[ROWS_MIN]);
    });

    it('updates when rows change', () => {
      const store = usePlinkoStore();
      store.setRows(12);
      expect(store.multipliers).toEqual(MULTIPLIERS[12]);
    });
  });

  describe('canDrop getter', () => {
    it('is true in idle state with sufficient balance', () => {
      const store = usePlinkoStore();
      expect(store.canDrop).toBe(true);
    });

    it('is false when gameState is Dropping', () => {
      const store = usePlinkoStore();
      store.gameState = GameState.Dropping;
      expect(store.canDrop).toBe(false);
    });

    it('is false when bet × balls exceeds balance', () => {
      const store = usePlinkoStore();
      store.betAmount = 600;
      store.ballsPerDrop = 2; // total = 1200 > 1000
      expect(store.canDrop).toBe(false);
    });

    it('is false when betAmount is below MIN_BET', () => {
      const store = usePlinkoStore();
      store.betAmount = 0.001;
      expect(store.canDrop).toBe(false);
    });

    it('is true when bet × balls exactly equals balance', () => {
      const store = usePlinkoStore();
      store.betAmount = 500;
      store.ballsPerDrop = 2; // total = 1000 = balance
      expect(store.canDrop).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions — setRows
  // ---------------------------------------------------------------------------
  describe('setRows', () => {
    it('sets rows to the given value when idle', () => {
      const store = usePlinkoStore();
      store.setRows(12);
      expect(store.rows).toBe(12);
    });

    it('clamps below ROWS_MIN', () => {
      const store = usePlinkoStore();
      store.setRows(1);
      expect(store.rows).toBe(ROWS_MIN);
    });

    it('clamps above ROWS_MAX', () => {
      const store = usePlinkoStore();
      store.setRows(100);
      expect(store.rows).toBe(ROWS_MAX);
    });

    it('is a no-op when not idle', () => {
      const store = usePlinkoStore();
      store.gameState = GameState.Dropping;
      store.setRows(14);
      expect(store.rows).toBe(ROWS_MIN);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions — setBetAmount
  // ---------------------------------------------------------------------------
  describe('setBetAmount', () => {
    it('sets the bet rounded to 2 decimal places', () => {
      const store = usePlinkoStore();
      store.setBetAmount(5.555);
      expect(store.betAmount).toBe(5.56);
    });

    it('clamps to the balance ceiling', () => {
      const store = usePlinkoStore();
      store.setBetAmount(99999);
      expect(store.betAmount).toBe(store.balance);
    });

    it('clamps to MIN_BET floor', () => {
      const store = usePlinkoStore();
      store.setBetAmount(0);
      expect(store.betAmount).toBe(0.01);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions — setBallsPerDrop
  // ---------------------------------------------------------------------------
  describe('setBallsPerDrop', () => {
    it('sets the count when idle', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(5);
      expect(store.ballsPerDrop).toBe(5);
    });

    it('clamps to 1 minimum', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(0);
      expect(store.ballsPerDrop).toBe(1);
    });

    it('clamps to 10 maximum', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(99);
      expect(store.ballsPerDrop).toBe(10);
    });

    it('is a no-op when not idle', () => {
      const store = usePlinkoStore();
      store.gameState = GameState.Dropping;
      store.setBallsPerDrop(5);
      expect(store.ballsPerDrop).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions — dropBall
  // ---------------------------------------------------------------------------
  describe('dropBall', () => {
    it('returns null when canDrop is false', () => {
      const store = usePlinkoStore();
      store.gameState = GameState.Dropping;
      expect(store.dropBall()).toBeNull();
    });

    it('deducts total bet from balance', () => {
      const store = usePlinkoStore();
      store.setBetAmount(10);
      store.setBallsPerDrop(3);
      store.dropBall();
      expect(store.balance).toBe(970);
    });

    it('transitions gameState to Dropping', () => {
      const store = usePlinkoStore();
      store.dropBall();
      expect(store.gameState).toBe(GameState.Dropping);
    });

    it('returns one path per ball', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(4);
      const paths = store.dropBall();
      expect(paths).toHaveLength(4);
    });

    it('each path has length equal to current rows', () => {
      const store = usePlinkoStore();
      store.setRows(12);
      const paths = store.dropBall();
      paths!.forEach(path => expect(path).toHaveLength(12));
    });

    it('each path entry is 0 or 1', () => {
      const store = usePlinkoStore();
      const paths = store.dropBall();
      paths!.flat().forEach(v => expect([0, 1]).toContain(v));
    });

    it('sets _ballsInFlight to ballsPerDrop', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(3);
      store.dropBall();
      expect(store._ballsInFlight).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Actions — onBallLanded
  // ---------------------------------------------------------------------------
  describe('onBallLanded', () => {
    it('credits correct payout to balance', () => {
      const store = usePlinkoStore();
      store.setBetAmount(10);
      store.dropBall();
      const balanceAfterDrop = store.balance;

      const bin = 0; // leftmost bin — highest multiplier for 8 rows
      const mult = MULTIPLIERS[ROWS_MIN]![bin]!;
      store.onBallLanded(bin);

      expect(store.balance).toBeCloseTo(balanceAfterDrop + 10 * mult, 2);
    });

    it('updates lastBin', () => {
      const store = usePlinkoStore();
      store.dropBall();
      store.onBallLanded(3);
      expect(store.lastBin).toBe(3);
    });

    it('pushes a RoundResult entry to history', () => {
      const store = usePlinkoStore();
      store.dropBall();
      store.onBallLanded(0);
      expect(store.history).toHaveLength(1);
    });

    it('history entry has correct shape', () => {
      const store = usePlinkoStore();
      store.setBetAmount(20);
      store.dropBall();
      const bin = 2;
      store.onBallLanded(bin);
      const entry = store.history[0]!;
      expect(entry.bin).toBe(bin);
      expect(entry.bet).toBe(20);
      expect(entry.mult).toBe(MULTIPLIERS[ROWS_MIN]![bin]);
      expect(entry.roundSize).toBe(1);
    });

    it('trims history to 20 entries maximum', () => {
      const store = usePlinkoStore();
      store.setBetAmount(1);
      // Fill history beyond the cap
      for (let i = 0; i < 25; i++) {
        store.dropBall();
        store.onBallLanded(0);
        // Reset state so subsequent drops are allowed
        store.gameState = GameState.Idle;
        store._ballsInFlight = 0;
      }
      expect(store.history.length).toBeLessThanOrEqual(20);
    });

    it('transitions to Idle after the last ball lands (via setTimeout)', () => {
      const store = usePlinkoStore();
      store.dropBall();
      expect(store._ballsInFlight).toBe(1);

      store.onBallLanded(0);
      expect(store.gameState).toBe(GameState.Result);

      vi.advanceTimersByTime(300);
      expect(store.gameState).toBe(GameState.Idle);
    });

    it('does NOT transition to idle until all balls of a multi-drop have landed', () => {
      const store = usePlinkoStore();
      store.setBallsPerDrop(3);
      store.dropBall();

      store.onBallLanded(0);
      expect(store.gameState).toBe(GameState.Dropping);

      store.onBallLanded(1);
      expect(store.gameState).toBe(GameState.Dropping);

      store.onBallLanded(2);
      expect(store.gameState).toBe(GameState.Result);

      vi.advanceTimersByTime(300);
      expect(store.gameState).toBe(GameState.Idle);
    });

    it('uses a multiplier of 0 for an unknown bin, crediting nothing', () => {
      const store = usePlinkoStore();
      store.dropBall();
      const balanceBefore = store.balance;
      store.onBallLanded(9999);
      expect(store.balance).toBe(balanceBefore);
    });
  });
});
