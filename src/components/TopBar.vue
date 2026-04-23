<script setup lang="ts">
import BalanceDisplay from '@/components/BalanceDisplay.vue';
import { useSound } from '@/composables/useSound';

const { enabled: soundEnabled, toggle: toggleSound } = useSound();
</script>

<template>
  <header class="top-bar">
    <span class="brand">Plinko</span>

    <div class="right-zone">
      <button
        class="mute-btn"
        :aria-label="soundEnabled ? 'Mute sound' : 'Unmute sound'"
        :title="soundEnabled ? 'Mute sound' : 'Unmute sound'"
        @click="toggleSound"
      >
        <!-- Speaker on -->
        <svg v-if="soundEnabled" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
        <!-- Speaker muted -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      </button>

      <BalanceDisplay />
    </div>
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

.right-zone {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mute-btn {
  width: 32px;
  height: 32px;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--duration-fast), border-color var(--duration-fast),
              background var(--duration-fast);
}

.mute-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-default);
  background: var(--bg-elevated);
}

.mute-btn svg {
  width: 18px;
  height: 18px;
}
</style>
