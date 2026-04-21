<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Application, Graphics } from 'pixi.js';

const hostEl = ref<HTMLDivElement | null>(null);

let pixiApp: Application | null = null;

onMounted(async () => {
  if (!hostEl.value) return;

  const app = new Application();

  pixiApp = app;

  await app.init({
    resizeTo: hostEl.value,
    background: '#0b1020',
    antialias: true,
  });

  hostEl.value.appendChild(app.canvas);

  const circle = new Graphics()
    .circle(0, 0, 40)
    .fill({ color: 0xffd34d });

  circle.position.set(app.screen.width / 2, app.screen.height / 2);
  app.stage.addChild(circle);

  app.ticker.add(() => {
    circle.rotation += 0.01;
  });
});

onUnmounted(() => {
  if (!pixiApp) return;

  const canvas = pixiApp.canvas;

  pixiApp.destroy();
  canvas?.remove();
  pixiApp = null;
});
</script>

<template>
  <div ref="hostEl" class="pixi-host" />
</template>

<style scoped>
.pixi-host {
  width: min(900px, 100%);
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
</style>
