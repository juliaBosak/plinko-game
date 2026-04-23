<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import { BALLS_MIN, BALLS_MAX } from '@/constants/layout';

const store = usePlinkoStore();
const { ballsPerDrop, gameState } = storeToRefs(store);
const { setBallsPerDrop } = store;

const isDisabled = computed(() => !isIdleGameState(gameState.value));

function onInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val)) setBallsPerDrop(val);
}
</script>

<template>
  <div class="balls-slider" :class="{ disabled: isDisabled }">
    <div class="slider-header">
      <span class="label">Balls</span>
      <span class="value">{{ ballsPerDrop }}</span>
    </div>
    <input
      type="range"
      :min="BALLS_MIN"
      :max="BALLS_MAX"
      :step="1"
      :value="ballsPerDrop"
      :disabled="isDisabled"
      class="range"
      @input="onInput"
    />
    <div class="tick-row">
      <span v-for="n in (BALLS_MAX - BALLS_MIN + 1)" :key="n" class="tick">{{ n + BALLS_MIN - 1 }}</span>
    </div>
  </div>
</template>

<style scoped>
.balls-slider {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.slider-header {
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

.value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 24px;
  text-align: right;
}

.range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--border-default);
  border-radius: var(--radius-pill);
  outline: none;
  cursor: pointer;
  accent-color: var(--teal);
  transition: opacity var(--duration-fast);
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--teal);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 200, 160, 0.6);
  cursor: pointer;
  transition: box-shadow var(--duration-fast);
}

.range::-webkit-slider-thumb:hover {
  box-shadow: 0 0 10px rgba(0, 200, 160, 0.9);
}

.disabled .range {
  opacity: 0.4;
  cursor: not-allowed;
}

.tick-row {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}

.tick {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 0;
  text-align: center;
}
</style>
