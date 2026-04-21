<script setup lang="ts">
import PixiStage from './components/PixiStage.vue';
</script>

<template>
  <main class="page">
    <header class="header">
      <h1>Plinko (PixiJS + Vue)</h1>
      <p class="subtle">
        PixiJS v8 is running inside a Vue component.
      </p>
    </header>

    <PixiStage />
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px 20px;
  display: grid;
  place-items: start center;
  gap: 16px;
  background: radial-gradient(1200px 600px at 10% 10%, #172554 0%, #0b1020 45%, #05060a 100%);
  color: #e5e7eb;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji",
    "Segoe UI Emoji";
}

.header {
  width: min(900px, 100%);
}

.subtle {
  margin-top: 8px;
  color: rgba(229, 231, 235, 0.72);
}
</style>
