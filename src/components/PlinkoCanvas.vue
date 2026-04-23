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
  height: 500px;
  flex-shrink: 0;
  display: block;
  overflow: hidden;
  background: #0b0b18;
}

/* PixiJS manages canvas size via autoDensity — only enforce block display */
.pixi-host :deep(canvas) {
  display: block;
}

@media (max-width: 767px) {
  .pixi-host {
    height: 420px;
  }
}
</style>
