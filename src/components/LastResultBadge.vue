<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { formatUSD, round2 } from '@/utils/money';

const store = usePlinkoStore();
const { history } = storeToRefs(store);

/** All results belonging to the most recent round. */
const roundResults = computed(() => {
  if (!history.value.length) return [];
  const size = history.value.at(-1)!.roundSize;

  return history.value.slice(-size);
});

const totalPayout = computed(() =>
  round2(roundResults.value.reduce((s, r) => s + r.payout, 0))
);

const totalBet = computed(() =>
  round2(roundResults.value.reduce((s, r) => s + r.bet, 0))
);

const net = computed(() => round2(totalPayout.value - totalBet.value));

const isSingleBall = computed(() => roundResults.value.length === 1);

const resultClass = computed(() => {
  if (!roundResults.value.length) return '';
  if (net.value > 0) return 'result-win';
  if (net.value < 0) return 'result-loss';

  return 'result-push';
});

const sign = computed(() => {
  if (net.value > 0) return '+';
  if (net.value === 0) return '±';

  return '';
});

const resultLabel = computed(() =>
  isSingleBall.value
    ? 'Last result'
    : `Last result (${roundResults.value.length} balls)`
);
</script>

<template>
  <div v-if="roundResults.length" class="last-result" :class="resultClass">
    <span class="result-label">
      {{ resultLabel }}
    </span>
    <div class="result-body">
      <template v-if="isSingleBall">
        <span class="result-bin">Bin {{ roundResults[0]!.bin }}</span>
        <span class="result-mult">×{{ roundResults[0]!.mult }}</span>
      </template>
      <template v-else>
        <span class="result-bin">{{ formatUSD(totalPayout) }} out</span>
      </template>
      <span class="result-payout">{{ sign }}{{ formatUSD(net) }}</span>
    </div>
  </div>
</template>

<style scoped>
.last-result {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.result-body {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
}

.result-bin {
  color: var(--text-secondary);
}

.result-mult {
  color: var(--amber);
}

.result-payout {
  margin-left: auto;
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

/* ── Color variants ───────────────────────────────── */
.result-win  .result-payout { color: var(--win); }
.result-loss .result-payout { color: var(--loss); }
.result-push .result-payout { color: var(--text-secondary); }
</style>
