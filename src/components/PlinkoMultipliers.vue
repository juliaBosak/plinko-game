<script setup lang="ts">
import { computed } from 'vue';
import { usePlinkoStore } from '@/stores/plinkoStore';

const store = usePlinkoStore();

function multColorClass(mult: number): string {
  if (mult >= 10) return 'mult-jackpot';
  if (mult >= 5)  return 'mult-high';
  if (mult >= 2)  return 'mult-medium';
  if (mult >= 1)  return 'mult-low';

  return 'mult-loss';
}

function formatMult(mult: number): string {
  return `${mult}×`;
}

// Placeholder — wired properly in M2+ via store.lastLandedBin
const lastLandedBin = computed<number | null>(() => null);
</script>

<template>
  <div class="multiplier-strip">
    <div
      v-for="(mult, i) in store.multipliers"
      :key="i"
      class="mult-pill"
      :class="[multColorClass(mult), { 'mult-active': lastLandedBin === i }]"
    >
      {{ formatMult(mult) }}
    </div>
  </div>
</template>

<style scoped>
.multiplier-strip {
  display: flex;
  gap: 3px;
  padding: 8px 12px;
  background: rgba(10, 10, 24, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  /* pills always share the exact strip width — no scrolling, no overflow */
  width: 100%;
  box-sizing: border-box;
}

.mult-pill {
  flex: 1 1 0;
  min-width: 0;
  height: 28px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.mult-pill.mult-active {
  transform: scale(1.15);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6) inset;
}

/* Gradient colour classes */
.mult-jackpot { background: linear-gradient(135deg, #7f1d1d, #dc2626); }
.mult-high    { background: linear-gradient(135deg, #78350f, #d97706); }
.mult-medium  { background: linear-gradient(135deg, #14532d, #16a34a); }
.mult-low     { background: linear-gradient(135deg, #1e3a5f, #2563eb); }
.mult-loss    { background: linear-gradient(135deg, #1c1c2e, #4a4a6a); }
</style>
