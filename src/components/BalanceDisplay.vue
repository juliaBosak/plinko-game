<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { formatUSD } from '@/utils/money';

const { balance } = storeToRefs(usePlinkoStore());

const flashing = ref(false);

watch(balance, (next, prev) => {
  if (next <= prev) return;
  flashing.value = true;
  setTimeout(() => {
    flashing.value = false;
  }, 400);
});
</script>

<template>
  <div class="balance-display" :class="{ 'flash-win': flashing }">
    <span class="label">Balance:</span>
    <span class="amount">{{ formatUSD(balance) }}</span>
  </div>
</template>

<style scoped>
.balance-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--teal);
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.amount {
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

/* ── Flash animations ─────────────────────────────── */
@keyframes balance-win {
  0%   { color: var(--teal); transform: scale(1); }
  20%  { color: var(--win);  transform: scale(1.08); }
  100% { color: var(--teal); transform: scale(1); }
}

.flash-win .amount {
  animation: balance-win 400ms var(--ease-out) forwards;
}
</style>
