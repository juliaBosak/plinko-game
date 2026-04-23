<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { round2 } from '@/utils/money';
import { isIdleGameState } from '@/types/plinko';

const store = usePlinkoStore();
const { betAmount, balance, gameState } = storeToRefs(store);
const { setBetAmount } = store;

const isDisabled = computed(() => !isIdleGameState(gameState.value));

const errorMsg = computed<string | null>(() => {
  if (betAmount.value < 0.01) return 'Min bet is $0.01';
  if (betAmount.value > balance.value) return 'Insufficient balance';

  return null;
});

const isInvalid = computed(() => errorMsg.value !== null);

function onInput(e: Event) {
  const raw = parseFloat((e.target as HTMLInputElement).value);
  if (!isNaN(raw)) setBetAmount(raw);
}

function half() {
  setBetAmount(round2(Math.max(0.01, betAmount.value / 2)));
}

function double() {
  setBetAmount(round2(Math.min(balance.value, betAmount.value * 2)));
}

function max() {
  setBetAmount(balance.value);
}
</script>

<template>
  <div class="bet-input" :class="{ disabled: isDisabled }">
    <div class="bet-header">
      <span class="label">Bet Amount</span>
    </div>

    <div class="input-wrap" :class="{ invalid: isInvalid }">
      <span class="currency">$</span>
      <input
        type="number"
        class="bet-field"
        :value="betAmount"
        :disabled="isDisabled"
        min="0.01"
        :max="balance"
        step="0.01"
        @input="onInput"
      />
    </div>

    <p v-if="isInvalid" class="error-text">{{ errorMsg }}</p>

    <div class="quick-btns">
      <button class="quick-btn" :disabled="isDisabled" @click="half">/2</button>
      <button class="quick-btn" :disabled="isDisabled" @click="double">×2</button>
      <button class="quick-btn quick-btn--max" :disabled="isDisabled" @click="max">Max</button>
    </div>
  </div>
</template>

<style scoped>
.bet-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.bet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Input field ─────────────────────────────────── */
.input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 12px;
  transition: border-color var(--duration-fast);
}

.input-wrap:focus-within {
  border-color: var(--purple);
}

.input-wrap.invalid {
  border-color: var(--loss);
}

.currency {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: 4px;
  user-select: none;
}

.bet-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  padding: 10px 0;
  min-width: 0;
  -moz-appearance: textfield;
}

.bet-field::-webkit-outer-spin-button,
.bet-field::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

/* ── Error text ──────────────────────────────────── */
.error-text {
  font-size: 11px;
  color: var(--loss);
  padding: 0 2px;
}

/* ── Quick bet buttons ───────────────────────────── */
.quick-btns {
  display: flex;
  gap: 6px;
}

.quick-btn {
  flex: 1;
  padding: 7px 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
}

.quick-btn:hover:not(:disabled) {
  background: var(--bg-surface);
  border-color: var(--border-strong);
}

.quick-btn--max {
  color: var(--teal);
  border-color: rgba(0, 200, 160, 0.3);
}

.quick-btn--max:hover:not(:disabled) {
  background: rgba(0, 200, 160, 0.1);
  border-color: var(--teal);
}

/* ── Disabled state ──────────────────────────────── */
.disabled .input-wrap,
.disabled .quick-btn {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
