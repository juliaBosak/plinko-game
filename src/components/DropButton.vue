<script setup lang="ts">
import { computed } from 'vue';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { formatUSD, round2 } from '@/utils/money';

const store = usePlinkoStore();

const isDisabled = computed(() => !store.canDrop);

const label = computed(() => {
  const n = store.ballsPerDrop;

  return `DROP ${n} BALL${n > 1 ? 'S' : ''}`;
});

const subLabel = computed(() =>
  formatUSD(round2(store.betAmount * store.ballsPerDrop))
);

function onClick() {
  store.dropBall();
}
</script>

<template>
  <button
    class="drop-btn"
    :class="{ disabled: isDisabled }"
    :disabled="isDisabled"
    @click="onClick"
  >
    <span class="label">{{ label }}</span>
    <span class="sub-label">{{ subLabel }}</span>
  </button>
</template>

<style scoped>
.drop-btn {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  box-shadow: 0 4px 16px rgba(229, 57, 53, 0.45);
  transition:
    transform var(--duration-fast) var(--ease-spring),
    box-shadow var(--duration-fast),
    opacity var(--duration-fast);
  user-select: none;
}

.drop-btn:hover:not(.disabled) {
  transform: scale(1.02);
  box-shadow: 0 6px 22px rgba(229, 57, 53, 0.6);
}

.drop-btn:active:not(.disabled) {
  transform: scale(0.97);
  transition-duration: 80ms;
}

.drop-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.label {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sub-label {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
}
</style>
