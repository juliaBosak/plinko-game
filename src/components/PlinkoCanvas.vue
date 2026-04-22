<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { usePlinkoBoard } from '@/composables/usePlinkoBoard';

const host = ref<HTMLDivElement | null>(null);
const { mount, unmount } = usePlinkoBoard();

onMounted(async () => {
  if (host.value) await mount(host.value);
});

onUnmounted(() => {
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
