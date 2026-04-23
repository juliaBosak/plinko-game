<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from 'vue';
import { usePlinkoBoard } from '@/composables/usePlinkoBoard';
import { usePlinkoStore } from '@/stores/plinkoStore';

const host = useTemplateRef<HTMLDivElement>('host');
const { mount, unmount, spawnBalls } = usePlinkoBoard();
const store = usePlinkoStore();

const stopWatchingDropBallAction = store.$onAction(({ name, after }) => {
  if (name !== 'dropBall') return;
  after((paths) => {
    if (paths) spawnBalls(paths);
  });
});

onMounted(async () => {
  if (host.value) await mount(host.value);
});

onUnmounted(() => {
  stopWatchingDropBallAction();
  unmount();
});
</script>

<template>
  <div ref="host" class="pixi-host" />
</template>

<style scoped>
.pixi-host {
  width: 100%;
  height: clamp(500px, 60vh, 700px);
  height: clamp(500px, 60dvh, 700px);
  flex-shrink: 0;
  display: block;
  overflow: hidden;
  background: #0b0b18;
}

/* PixiJS manages canvas size via autoDensity — only enforce block display */
.pixi-host :deep(canvas) {
  display: block;
}

/* ── Mobile wide  480–767px ───────────────────────── */
@media (max-width: 767px) {
  .pixi-host {
    height: clamp(320px, 60vh, 520px);
    height: clamp(320px, 60dvh, 520px);
  }
}

/* ── Mobile compact  < 480px ──────────────────────── */
@media (max-width: 479px) {
  .pixi-host {
    height: clamp(280px, 55vh, 420px);
    height: clamp(280px, 55dvh, 420px);
  }
}
</style>
