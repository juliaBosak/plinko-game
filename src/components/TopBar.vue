<script setup lang="ts">
import BalanceDisplay from '@/components/BalanceDisplay.vue';
</script>

<template>
  <header class="top-bar">
    <span class="brand">Plinko</span>
    <BalanceDisplay />
  </header>
</template>

<style scoped>
.top-bar {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
}

.brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}
</style>
